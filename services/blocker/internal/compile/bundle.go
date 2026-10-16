package compile

import (
	"path/filepath"
)

func CompileAll(root, outDir string, extraHosts []string) (*Meta, *Meta, error) {
	mainMeta, err := Compile(
		[]string{root},
		extraHosts,
		filepath.Join(outDir, "blocklist.txt"),
		filepath.Join(outDir, "blocklist.meta.json"),
	)
	if err != nil {
		return nil, nil, err
	}

	strictMeta, err := Compile(
		[]string{root, filepath.Join(root, "strict")},
		extraHosts,
		filepath.Join(outDir, "blocklist-strict.txt"),
		filepath.Join(outDir, "blocklist-strict.meta.json"),
	)
	if err != nil {
		return nil, nil, err
	}
	return mainMeta, strictMeta, nil
}
