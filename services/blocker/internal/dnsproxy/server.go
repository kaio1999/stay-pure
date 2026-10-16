package dnsproxy

import (
	"encoding/binary"
	"fmt"
	"net"
	"strings"

	"github.com/staypure/blocker/internal/filter"
)

type Server struct {
	Matcher  *filter.Matcher
	Upstream string
	OnBlock  func(host string)
}

func (s *Server) ListenAndServe(addr string) error {
	pc, err := net.ListenPacket("udp", addr)
	if err != nil {
		return err
	}
	defer pc.Close()

	buf := make([]byte, 2048)
	for {
		n, from, err := pc.ReadFrom(buf)
		if err != nil {
			return err
		}
		resp, blockedHost, err := s.handle(buf[:n])
		if err != nil || resp == nil {
			continue
		}
		if blockedHost != "" && s.OnBlock != nil {
			s.OnBlock(blockedHost)
		}
		_, _ = pc.WriteTo(resp, from)
	}
}

func (s *Server) handle(query []byte) ([]byte, string, error) {
	host, err := questionName(query)
	if err != nil {
		return nil, "", err
	}
	if s.Matcher.ShouldBlock(host) {
		return nxdomain(query), host, nil
	}
	if s.Upstream == "" {
		s.Upstream = "1.1.1.1:53"
	}
	conn, err := net.Dial("udp", s.Upstream)
	if err != nil {
		return nil, "", err
	}
	defer conn.Close()
	if _, err := conn.Write(query); err != nil {
		return nil, "", err
	}
	buf := make([]byte, 2048)
	n, err := conn.Read(buf)
	if err != nil {
		return nil, "", err
	}
	return buf[:n], "", nil
}

func questionName(msg []byte) (string, error) {
	if len(msg) < 13 {
		return "", fmt.Errorf("short")
	}
	offset := 12
	var labels []string
	for {
		if offset >= len(msg) {
			return "", fmt.Errorf("truncated")
		}
		size := int(msg[offset])
		if size == 0 {
			break
		}
		if size&0xC0 != 0 {
			return "", fmt.Errorf("compressed qname")
		}
		offset++
		if offset+size > len(msg) {
			return "", fmt.Errorf("label overflow")
		}
		labels = append(labels, string(msg[offset:offset+size]))
		offset += size
	}
	return strings.ToLower(strings.Join(labels, ".")), nil
}

func nxdomain(query []byte) []byte {
	resp := make([]byte, len(query))
	copy(resp, query)
	if len(resp) < 12 {
		return resp
	}
	flags := binary.BigEndian.Uint16(resp[2:4])
	flags |= 0x8000
	flags = (flags &^ 0xF) | 0x3
	binary.BigEndian.PutUint16(resp[2:4], flags)
	binary.BigEndian.PutUint16(resp[6:8], 0)
	binary.BigEndian.PutUint16(resp[8:10], 0)
	binary.BigEndian.PutUint16(resp[10:12], 0)
	return resp
}
