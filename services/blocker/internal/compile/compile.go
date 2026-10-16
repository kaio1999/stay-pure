package compile

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/staypure/blocker/internal/filter"
)

type Meta struct {
	GeneratedAt string `json:"generatedAt"`
	Domains     int    `json:"domains"`
	TLDs        int    `json:"tlds"`
	Sources     []string `json:"sources"`
}

func Compile(listDirs []string, extraHosts []string, outPath, metaPath string) (*Meta, error) {
	m := filter.New()
	sources := make([]string, 0, 8)

	for _, dir := range listDirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			return nil, err
		}
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".txt") {
				continue
			}
			path := filepath.Join(dir, entry.Name())
			if err := loadFile(m, path); err != nil {
				return nil, err
			}
			sources = append(sources, filepath.Base(path))
		}
	}

	for _, path := range extraHosts {
		if err := loadHostsFile(m, path); err != nil {
			return nil, err
		}
		sources = append(sources, filepath.Base(path))
	}

	if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
		return nil, err
	}

	domains := collect(m)
	sort.Strings(domains)

	f, err := os.Create(outPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	w := bufio.NewWriter(f)
	if _, err := fmt.Fprintf(w, "# stay-pure compiled blocklist\n# generated %s\n", time.Now().UTC().Format(time.RFC3339)); err != nil {
		return nil, err
	}
	tlds := 0
	for _, line := range domains {
		if strings.HasPrefix(line, "tld:") {
			tlds++
		}
		if _, err := w.WriteString(line + "\n"); err != nil {
			return nil, err
		}
	}
	if err := w.Flush(); err != nil {
		return nil, err
	}

	meta := &Meta{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Domains:     m.Count(),
		TLDs:        tlds,
		Sources:     sources,
	}
	if metaPath != "" {
		raw, err := json.MarshalIndent(meta, "", "  ")
		if err != nil {
			return nil, err
		}
		if err := os.WriteFile(metaPath, raw, 0o644); err != nil {
			return nil, err
		}
	}
	return meta, nil
}

func collect(m *filter.Matcher) []string {
	var b strings.Builder
	_ = m.Write(&b)
	lines := strings.Split(strings.TrimSpace(b.String()), "\n")
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		if line != "" {
			out = append(out, line)
		}
	}
	return out
}

func loadFile(m *filter.Matcher, path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	return m.Load(f)
}

func loadHostsFile(m *filter.Matcher, path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 0, 64*1024), 2*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		fields := strings.Fields(line)
		host := fields[0]
		if len(fields) >= 2 && (fields[0] == "0.0.0.0" || fields[0] == "127.0.0.1") {
			host = fields[1]
		}
		if host == "localhost" || host == "broadcasthost" || strings.HasSuffix(host, ".local") {
			continue
		}
		m.Add(host)
	}
	return scanner.Err()
}
