#GOPATH=$(realpath .) go test -coverprofile=coverage.out libink/parser
GOPATH=$(realpath .) go test -v -coverprofile=coverage.out libink/universe && \
GOPATH=$(realpath .) go tool cover -html coverage.out
