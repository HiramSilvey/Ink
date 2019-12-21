#GOPATH=$(realpath .) go test -coverprofile=coverage.out libink/parser
if [[ "$1" == "cover" ]]; then
    GOPATH=$(realpath .) go test -v -coverprofile=coverage.out libink && GOPATH=$(realpath .) go tool cover -html coverage.out && rm coverage.out
else
    GOPATH=$(realpath .) go test -v libink
fi
