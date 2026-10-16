package compile

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var DefaultSources = []string{
	"https://raw.githubusercontent.com/StevenBlack/hosts/master/extensions/porn/sinfonietta/hosts",
	"https://raw.githubusercontent.com/StevenBlack/hosts/master/extensions/porn/sinfonietta-snuff/hosts",
}

func Fetch(urls []string, destDir string) ([]string, error) {
	if err := os.MkdirAll(destDir, 0o755); err != nil {
		return nil, err
	}
	client := &http.Client{Timeout: 45 * time.Second}
	paths := make([]string, 0, len(urls))
	for i, url := range urls {
		path := filepath.Join(destDir, fmt.Sprintf("remote-%d.hosts", i+1))
		if err := download(client, url, path); err != nil {
			fmt.Fprintf(os.Stderr, "aviso: falha ao baixar %s: %v\n", url, err)
			continue
		}
		paths = append(paths, path)
	}
	return paths, nil
}

func download(client *http.Client, url, dest string) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "stay-pure-blocker/1.0")
	res, err := client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("status %d", res.StatusCode)
	}
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = io.Copy(f, res.Body)
	return err
}
