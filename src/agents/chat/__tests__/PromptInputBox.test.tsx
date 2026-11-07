import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { PromptInputBox, type PromptInputBoxHandle } from "@/components/ui/prompt-input-box";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

let createObjectURLMock: ReturnType<typeof vi.fn>;
let revokeObjectURLMock: ReturnType<typeof vi.fn>;

function setPointerFine(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query === "(pointer: fine)" ? matches : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function getFileInput(container: HTMLElement) {
  const input = container.querySelector('input[type="file"]');
  expect(input).not.toBeNull();
  return input as HTMLInputElement;
}

function createTestFileTransfer(files: File[]) {
  return { files };
}

describe("PromptInputBox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPointerFine(false);
    let previewCount = 0;
    createObjectURLMock = vi.fn(() => `blob:preview-${++previewCount}`);
    revokeObjectURLMock = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: createObjectURLMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectURLMock,
    });
  });

  it("renderiza o placeholder default em pt-BR", () => {
    render(<PromptInputBox onSend={vi.fn()} />);

    expect(screen.getByPlaceholderText("Digite uma mensagem...")).toBeInTheDocument();
  });

  it("mantem anexar, textarea e enviar na mesma linha do composer vazio", () => {
    render(<PromptInputBox onSend={vi.fn()} autoFocus={false} />);

    const mainRow = screen.getByTestId("prompt-input-main-row");
    const attachButton = screen.getByRole("button", { name: "Anexar arquivos" });
    const textarea = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: "Enviar mensagem" });

    expect(mainRow).toContainElement(attachButton);
    expect(mainRow).toContainElement(textarea);
    expect(mainRow).toContainElement(sendButton);
    expect(mainRow.className).toContain("grid-cols-[auto_minmax(0,1fr)_auto]");
  });

  it("envia com Enter e limpa o textarea", async () => {
    const onSend = vi.fn();

    render(<PromptInputBox onSend={onSend} autoFocus={false} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "oi mundo" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    expect(onSend).toHaveBeenCalledWith("oi mundo", []);
    expect(textarea).toHaveValue("");
  });

  it("insere quebra de linha com Shift+Enter sem enviar", () => {
    const onSend = vi.fn();

    render(<PromptInputBox onSend={onSend} autoFocus={false} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "linha 1" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    fireEvent.change(textarea, { target: { value: "linha 1\nlinha 2" } });

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("linha 1\nlinha 2");
  });

  it("limita autosize do textarea a 160px em mobile", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockReturnValue(400);

    render(<PromptInputBox onSend={vi.fn()} autoFocus={false} />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, {
      target: { value: Array.from({ length: 20 }, (_, index) => `linha ${index}`).join("\n") },
    });

    expect(textarea).toHaveStyle({ height: "160px" });
  });

  it("nao chama onSend em submit vazio", () => {
    const onSend = vi.fn();

    render(<PromptInputBox onSend={onSend} autoFocus={false} />);

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("mostra o botao de parar durante loading quando onStop existe", () => {
    const onStop = vi.fn();

    render(<PromptInputBox onSend={vi.fn()} onStop={onStop} isLoading autoFocus={false} />);

    const stopButton = screen.getByRole("button", { name: "Parar resposta" });
    fireEvent.click(stopButton);

    expect(onStop).toHaveBeenCalledOnce();
  });

  it("mantem o botao de parar visivel durante loading mesmo com disabled", () => {
    render(<PromptInputBox onSend={vi.fn()} onStop={vi.fn()} isLoading disabled autoFocus={false} />);

    expect(screen.getByRole("button", { name: "Parar resposta" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar mensagem" })).not.toBeInTheDocument();
  });

  it("mantem o botao de enviar desabilitado durante loading sem onStop", () => {
    render(<PromptInputBox onSend={vi.fn()} isLoading autoFocus={false} />);

    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
  });

  it("foca o textarea por padrao", () => {
    render(<PromptInputBox onSend={vi.fn()} />);

    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("usa initialValue como valor inicial do textarea", () => {
    render(<PromptInputBox onSend={vi.fn()} initialValue="contexto previo" autoFocus={false} />);

    expect(screen.getByRole("textbox")).toHaveValue("contexto previo");
  });

  it("expõe handle imperativo com setValue, focus e clear", () => {
    const Harness = () => {
      const ref = useRef<PromptInputBoxHandle>(null);

      return (
        <>
          <PromptInputBox ref={ref} onSend={vi.fn()} autoFocus={false} />
          <button type="button" onClick={() => ref.current?.setValue("via handle")}>
            set
          </button>
          <button type="button" onClick={() => ref.current?.clear()}>
            clear
          </button>
          <button type="button" onClick={() => ref.current?.focus()}>
            focus
          </button>
        </>
      );
    };

    render(<Harness />);

    const textarea = screen.getByRole("textbox");

    fireEvent.click(screen.getByRole("button", { name: "set" }));
    expect(textarea).toHaveValue("via handle");

    fireEvent.click(screen.getByRole("button", { name: "clear" }));
    expect(textarea).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "focus" }));
    expect(textarea).toHaveFocus();
  });

  it("rejeita tipo de arquivo nao suportado e nao mostra o arquivo na UI", async () => {
    const { container } = render(<PromptInputBox onSend={vi.fn()} autoFocus={false} />);

    const uploadInput = getFileInput(container);
    const unsupportedFile = new File(["video"], "movie.mp4", { type: "video/mp4" });

    await act(async () => {
      fireEvent.change(uploadInput, {
        target: { files: [unsupportedFile] },
      });
    });

    expect(toast.error).toHaveBeenCalledOnce();
    expect(screen.queryByText("movie.mp4")).not.toBeInTheDocument();
  });

  it("envia Attachment[] com previewUrl para a mensagem renderizar thumbs", async () => {
    const onSend = vi.fn();
    const file = new File(["image"], "foto.png", { type: "image/png" });

    const { container } = render(<PromptInputBox onSend={onSend} autoFocus={false} />);
    const uploadInput = getFileInput(container);

    await act(async () => {
      fireEvent.change(uploadInput, {
        target: { files: [file] },
      });
    });

    expect(await screen.findByRole("button", { name: "Abrir preview de foto.png" })).toBeInTheDocument();
    expect(createObjectURLMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("", [
      expect.objectContaining({
        id: expect.any(String),
        type: "image",
        file,
        name: "foto.png",
        sizeBytes: file.size,
      }),
    ]);

    const sentAttachment = onSend.mock.calls[0][1][0];
    expect(sentAttachment.previewUrl).toMatch(/^data:image\/png;base64,/);
    expect(screen.queryByRole("button", { name: "Abrir preview de foto.png" })).not.toBeInTheDocument();
    expect(revokeObjectURLMock).not.toHaveBeenCalled();
  });

  it("bloqueia uploads fora de acceptedTypes", async () => {
    const file = new File(["texto"], "nota.txt", { type: "text/plain" });
    const { container } = render(
      <PromptInputBox onSend={vi.fn()} acceptedTypes={["image"]} autoFocus={false} />
    );

    await act(async () => {
      fireEvent.change(getFileInput(container), {
        target: { files: [file] },
      });
    });

    expect(toast.error).toHaveBeenCalledOnce();
    expect(screen.queryByText("nota.txt")).not.toBeInTheDocument();
  });

  it("respeita maxFiles ao adicionar anexos", async () => {
    const firstFile = new File(["a"], "primeiro.txt", { type: "text/plain" });
    const secondFile = new File(["b"], "segundo.txt", { type: "text/plain" });
    const { container } = render(<PromptInputBox onSend={vi.fn()} maxFiles={1} autoFocus={false} />);

    await act(async () => {
      fireEvent.change(getFileInput(container), {
        target: { files: [firstFile, secondFile] },
      });
    });

    expect(screen.getByText("primeiro.txt")).toBeInTheDocument();
    expect(screen.queryByText("segundo.txt")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it("nao cria objeto de preview para arquivo imagem que ultrapassa maxFiles", async () => {
    const firstFile = new File(["a"], "imagem1.png", { type: "image/png" });
    const secondFile = new File(["b"], "imagem2.png", { type: "image/png" });
    const { container } = render(<PromptInputBox onSend={vi.fn()} maxFiles={1} autoFocus={false} />);

    await act(async () => {
      fireEvent.change(getFileInput(container), {
        target: { files: [firstFile, secondFile] },
      });
    });

    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Abrir preview de imagem1.png" })).toBeInTheDocument();
    expect(screen.queryByText("imagem2.png")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it('usa o atalho "/" para focar o textarea no desktop', () => {
    setPointerFine(true);

    render(
      <>
        <button type="button">fora</button>
        <PromptInputBox onSend={vi.fn()} autoFocus={false} />
      </>
    );

    const outsideButton = screen.getByRole("button", { name: "fora" });
    const textarea = screen.getByRole("textbox");

    outsideButton.focus();
    expect(textarea).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "/" });

    expect(textarea).toHaveFocus();
  });

  it('nao intercepta o atalho "/" quando o composer esta disabled', () => {
    setPointerFine(true);

    render(
      <>
        <button type="button">fora</button>
        <PromptInputBox onSend={vi.fn()} disabled autoFocus={false} />
      </>
    );

    const outsideButton = screen.getByRole("button", { name: "fora" });
    outsideButton.focus();

    const event = new KeyboardEvent("keydown", { key: "/", cancelable: true });
    window.dispatchEvent(event);

    expect(outsideButton).toHaveFocus();
    expect(event.defaultPrevented).toBe(false);
  });

  it('nao intercepta o atalho "/" quando o composer esta loading', () => {
    setPointerFine(true);

    render(
      <>
        <button type="button">fora</button>
        <PromptInputBox onSend={vi.fn()} isLoading onStop={vi.fn()} autoFocus={false} />
      </>
    );

    const outsideButton = screen.getByRole("button", { name: "fora" });
    outsideButton.focus();

    const event = new KeyboardEvent("keydown", { key: "/", cancelable: true });
    window.dispatchEvent(event);

    expect(outsideButton).toHaveFocus();
    expect(event.defaultPrevented).toBe(false);
  });

});
describe("PromptInputBox.openFilePicker (handle)", () => {
  it("exibe metodo openFilePicker que dispara click no input file interno", () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    render(<PromptInputBox ref={ref} onSend={onSend} />);

    expect(typeof ref.current?.openFilePicker).toBe("function");

    const hidden = document.querySelector("input[type=\"file\"]") as HTMLInputElement;
    const clickSpy = vi.spyOn(hidden, "click");

    ref.current?.openFilePicker();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("com autoSend=true, ao selecionar arquivo PDF dispara onSend direto sem staging", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    const { container } = render(<PromptInputBox ref={ref} onSend={onSend} />);

    const hidden = getFileInput(container);
    const file = new File(["conteudo"], "teste.pdf", { type: "application/pdf" });
    await act(async () => {
      ref.current?.openFilePicker({ autoSend: true });
      Object.defineProperty(hidden, "files", { value: [file], configurable: true });
      fireEvent.change(hidden);
    });

    expect(onSend).toHaveBeenCalledTimes(1);
    const [text, attachments] = onSend.mock.calls[0];
    expect(text).toBe("");
    expect(attachments).toHaveLength(1);
    expect(attachments[0].type).toBe("pdf");
    expect(screen.queryByText("teste.pdf")).not.toBeInTheDocument();
  });

  it("consome autoSend apos tentativa invalida, sem vazar para selecao manual", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    const { container } = render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker({ autoSend: true });

    const hidden = getFileInput(container);
    const invalidFile = new File(["video"], "video.mp4", { type: "video/mp4" });
    await act(async () => {
      fireEvent.change(hidden, { target: { files: [invalidFile] } });
    });

    ref.current?.openFilePicker();

    const validFile = new File(["conteudo"], "teste.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.change(hidden, { target: { files: [validFile] } });
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText("teste.pdf")).toBeInTheDocument();
  });

  it("consome autoSend apos cancelamento, e selecao manual nao auto-envia", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    const { container } = render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker({ autoSend: true });

    const hidden = getFileInput(container);
    const attachmentButton = screen.getByRole("button", { name: "Anexar arquivos" });

    await act(async () => {
      fireEvent.blur(hidden);
    });

    fireEvent.click(attachmentButton);

    const file = new File(["conteudo"], "teste.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.change(hidden, { target: { files: [file] } });
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText("teste.pdf")).toBeInTheDocument();
  });

  it("autoSend ignora limite maxFiles porque nao faz staging", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    const { container } = render(<PromptInputBox ref={ref} onSend={onSend} maxFiles={1} />);

    const hidden = getFileInput(container);

    ref.current?.openFilePicker();
    const stagedFile = new File(["conteudo"], "primeiro.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.change(hidden, { target: { files: [stagedFile] } });
    });

    expect(screen.getByText("primeiro.pdf")).toBeInTheDocument();

    ref.current?.openFilePicker({ autoSend: true });
    const autoSendFile = new File(["conteudo"], "segundo.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.change(hidden, { target: { files: [autoSendFile] } });
    });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(
      "",
      [expect.objectContaining({ name: "segundo.pdf", type: "pdf" })]
    );
    expect(screen.queryByText("segundo.pdf")).not.toBeInTheDocument();
  });

  it("sem autoSend (default), ao selecionar arquivo apenas faz staging como chip", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    const { container } = render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker();

    const hidden = getFileInput(container);
    const file = new File(["conteudo"], "teste.pdf", { type: "application/pdf" });
    await act(async () => {
      fireEvent.change(hidden, { target: { files: [file] } });
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText("teste.pdf")).toBeInTheDocument();
  });

  it("nao herda autoSend pendente em paste", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker({ autoSend: true });

    const textarea = screen.getByRole("textbox");
    const file = new File(["conteudo"], "colado.txt", { type: "text/plain" });

    await act(async () => {
      fireEvent.paste(textarea, {
        clipboardData: createTestFileTransfer([file]),
      });
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText("colado.txt")).toBeInTheDocument();
  });

  it("nao herda autoSend pendente em drop", async () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker({ autoSend: true });

    const form = screen.getByRole("textbox").closest("form");
    const file = new File(["conteudo"], "arrastado.txt", { type: "text/plain" });

    expect(form).not.toBeNull();
    await act(async () => {
      fireEvent.drop(form!, {
        dataTransfer: createTestFileTransfer([file]),
      });
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByText("arrastado.txt")).toBeInTheDocument();
  });
});
