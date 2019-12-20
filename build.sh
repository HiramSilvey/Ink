GOPATH=$(realpath .) go build checkers
GOPATH=$(realpath .) GOOS=js GOARCH=wasm go build -o page/ink.wasm frontend
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" page
