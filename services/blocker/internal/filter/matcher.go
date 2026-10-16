package filter

import (
	"bufio"
	"io"
	"strings"
	"sync"
)

type Matcher struct {
	mu     sync.RWMutex
	exact  map[string]struct{}
	tlds   map[string]struct{}
	count  int
}

func New() *Matcher {
	return &Matcher{
		exact: make(map[string]struct{}, 4096),
		tlds:  make(map[string]struct{}, 8),
	}
}

func (m *Matcher) AddTLD(tld string) {
	tld = normalize(tld)
	if tld == "" {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.tlds[tld]; ok {
		return
	}
	m.tlds[tld] = struct{}{}
}

func (m *Matcher) Add(domain string) {
	domain = normalize(domain)
	if domain == "" || !isDomain(domain) {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.exact[domain]; ok {
		return
	}
	m.exact[domain] = struct{}{}
	m.count++
}

func (m *Matcher) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.count
}

func (m *Matcher) ShouldBlock(host string) bool {
	host = normalize(host)
	if host == "" {
		return false
	}

	m.mu.RLock()
	defer m.mu.RUnlock()

	if idx := strings.LastIndexByte(host, '.'); idx >= 0 {
		if _, ok := m.tlds[host[idx+1:]]; ok {
			return true
		}
	}

	for {
		if _, ok := m.exact[host]; ok {
			return true
		}
		dot := strings.IndexByte(host, '.')
		if dot < 0 {
			return false
		}
		host = host[dot+1:]
	}
}

func (m *Matcher) Load(r io.Reader) error {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		if strings.HasPrefix(line, "tld:") {
			m.AddTLD(strings.TrimSpace(line[4:]))
			continue
		}
		m.Add(line)
	}
	return scanner.Err()
}

func (m *Matcher) Write(w io.Writer) error {
	m.mu.RLock()
	defer m.mu.RUnlock()

	bw := bufio.NewWriter(w)
	for tld := range m.tlds {
		if _, err := bw.WriteString("tld:" + tld + "\n"); err != nil {
			return err
		}
	}
	for domain := range m.exact {
		if _, err := bw.WriteString(domain + "\n"); err != nil {
			return err
		}
	}
	return bw.Flush()
}

func normalize(host string) string {
	host = strings.TrimSpace(strings.ToLower(host))
	host = strings.TrimPrefix(host, "http://")
	host = strings.TrimPrefix(host, "https://")
	if i := strings.IndexByte(host, '/'); i >= 0 {
		host = host[:i]
	}
	if i := strings.IndexByte(host, ':'); i >= 0 {
		host = host[:i]
	}
	host = strings.TrimPrefix(host, "*.")
	host = strings.TrimPrefix(host, ".")
	if strings.HasPrefix(host, "www.") {
		host = host[4:]
	}
	return strings.TrimSuffix(host, ".")
}

func isDomain(host string) bool {
	if strings.ContainsAny(host, " /\\") {
		return false
	}
	return strings.Contains(host, ".")
}
