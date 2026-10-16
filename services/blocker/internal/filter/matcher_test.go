package filter

import (
	"strings"
	"testing"
)

func TestShouldBlockSuffixAndTLD(t *testing.T) {
	m := New()
	m.Add("pornhub.com")
	m.AddTLD("xxx")

	cases := map[string]bool{
		"pornhub.com":           true,
		"www.pornhub.com":       true,
		"cdn.pornhub.com":       true,
		"https://pornhub.com/x": true,
		"example.com":           false,
		"notpornhub.com":        false,
		"video.xxx":             true,
		"google.com":            false,
	}

	for host, want := range cases {
		if got := m.ShouldBlock(host); got != want {
			t.Fatalf("%s: got %v want %v", host, got, want)
		}
	}
}

func TestLoadIgnoresComments(t *testing.T) {
	m := New()
	input := "# comment\n\npornhub.com\ntld:porn\n"
	if err := m.Load(strings.NewReader(input)); err != nil {
		t.Fatal(err)
	}
	if m.Count() != 1 {
		t.Fatalf("count=%d", m.Count())
	}
	if !m.ShouldBlock("a.b.porn") {
		t.Fatal("expected tld block")
	}
}
