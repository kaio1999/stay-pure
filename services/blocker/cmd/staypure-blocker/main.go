package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"github.com/staypure/blocker/internal/compile"
	"github.com/staypure/blocker/internal/dnsproxy"
	"github.com/staypure/blocker/internal/filter"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "compile":
		compileCmd(os.Args[2:])
	case "check":
		checkCmd(os.Args[2:])
	case "serve":
		serveCmd(os.Args[2:])
	default:
		usage()
		os.Exit(2)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, `staypure-blocker

comandos:
  compile   gera a blocklist compacta usada pelo app Android
  check     testa se um host seria bloqueado
  serve     sobe um DNS sinkhole local (teste em desktop)`)
}

func compileCmd(args []string) {
	fs := flag.NewFlagSet("compile", flag.ExitOnError)
	outDir := fs.String("out", "dist", "diretório de saída")
	fetch := fs.Bool("fetch", false, "baixa listas públicas de hosts (pornografia)")
	_ = fs.Parse(args)

	root := findBlocklists()
	tmp := filepath.Join(os.TempDir(), "stay-pure-hosts")
	var extra []string
	if *fetch {
		paths, err := compile.Fetch(compile.DefaultSources, tmp)
		if err != nil {
			fatal(err)
		}
		extra = paths
	}

	mainMeta, strictMeta, err := compile.CompileAll(root, *outDir, extra)
	if err != nil {
		fatal(err)
	}
	fmt.Printf("blocklist: %d domínios → %s/blocklist.txt\n", mainMeta.Domains, *outDir)
	fmt.Printf("modo estrito: %d domínios → %s/blocklist-strict.txt\n", strictMeta.Domains, *outDir)
}

func checkCmd(args []string) {
	fs := flag.NewFlagSet("check", flag.ExitOnError)
	list := fs.String("list", "", "blocklist compilada")
	_ = fs.Parse(args)
	if fs.NArg() != 1 || *list == "" {
		fmt.Fprintln(os.Stderr, "uso: staypure-blocker check --list blocklist.txt host")
		os.Exit(2)
	}
	m := mustLoad(*list)
	host := fs.Arg(0)
	if m.ShouldBlock(host) {
		fmt.Printf("BLOQUEADO %s\n", host)
		return
	}
	fmt.Printf("liberado %s\n", host)
}

func serveCmd(args []string) {
	fs := flag.NewFlagSet("serve", flag.ExitOnError)
	list := fs.String("list", "", "blocklist compilada")
	addr := fs.String("listen", "127.0.0.1:5353", "endereço UDP")
	_ = fs.Parse(args)
	if *list == "" {
		fatal(fmt.Errorf("--list é obrigatório"))
	}
	m := mustLoad(*list)
	fmt.Printf("DNS sinkhole em %s (%d domínios)\n", *addr, m.Count())
	srv := &dnsproxy.Server{
		Matcher: m,
		OnBlock: func(host string) {
			fmt.Printf("bloqueado: %s\n", host)
		},
	}
	fatal(srv.ListenAndServe(*addr))
}

func mustLoad(path string) *filter.Matcher {
	f, err := os.Open(path)
	if err != nil {
		fatal(err)
	}
	defer f.Close()
	m := filter.New()
	if err := m.Load(f); err != nil {
		fatal(err)
	}
	return m
}

func findBlocklists() string {
	candidates := []string{
		"blocklists",
		filepath.Join("services", "blocker", "blocklists"),
	}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(exe), "blocklists"))
	}
	wd, _ := os.Getwd()
	candidates = append(candidates, filepath.Join(wd, "blocklists"))
	for _, c := range candidates {
		if st, err := os.Stat(c); err == nil && st.IsDir() {
			return c
		}
	}
	return "blocklists"
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
