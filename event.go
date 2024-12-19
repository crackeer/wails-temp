package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ExecCommandWriter struct {
	context.Context
	From string
}

func NewExecCommandWriter(ctx context.Context, from string) *ExecCommandWriter {
	return &ExecCommandWriter{
		Context: ctx,
		From:    from,
	}
}

func (writer *ExecCommandWriter) Write(data []byte) (int, error) {
	fmt.Println(writer.From, string(data))
	runtime.EventsEmit(writer.Context, "command-exec-output", string(data))
	return len(data), nil
}
