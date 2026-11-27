export function criarMarcacaoImagemComentario(url: string): string {
  const wrapper = document.createElement('span');
  wrapper.className = 'comentario-imagem-pendente';
  wrapper.contentEditable = 'false';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'inline-block';
  wrapper.style.maxWidth = '100%';
  wrapper.style.margin = '0.25rem 1.75rem 0.25rem 0';
  wrapper.style.verticalAlign = 'middle';

  const imagem = document.createElement('img');
  imagem.src = url;
  imagem.alt = 'Imagem anexada ao comentário';
  imagem.style.display = 'block';
  imagem.style.maxWidth = 'min(240px, 100%)';
  imagem.style.maxHeight = '180px';
  imagem.style.borderRadius = '8px';
  imagem.style.objectFit = 'contain';

  const remover = document.createElement('button');
  remover.type = 'button';
  remover.className = 'comentario-imagem-remover';
  remover.setAttribute('aria-label', 'Remover imagem');
  remover.textContent = '×';
  remover.style.position = 'absolute';
  remover.style.top = '-8px';
  remover.style.right = '-8px';
  remover.style.width = '24px';
  remover.style.height = '24px';
  remover.style.padding = '0';
  remover.style.border = '0';
  remover.style.borderRadius = '50%';
  remover.style.background = 'var(--tf-danger)';
  remover.style.color = '#fff';
  remover.style.fontSize = '18px';
  remover.style.lineHeight = '24px';
  remover.style.textAlign = 'center';
  remover.style.cursor = 'pointer';

  wrapper.append(imagem, remover);
  return wrapper.outerHTML;
}

export function prepararHtmlComentario(editor: HTMLElement | null): string {
  if (!editor) return '';

  const copia = editor.cloneNode(true) as HTMLElement;
  copia.querySelectorAll('.comentario-imagem-pendente').forEach(wrapper => {
    const imagemOriginal = wrapper.querySelector('img');
    if (!imagemOriginal) {
      wrapper.remove();
      return;
    }

    const imagem = document.createElement('img');
    imagem.src = imagemOriginal.getAttribute('src') || imagemOriginal.src;
    imagem.alt = imagemOriginal.alt;
    imagem.className = 'comentario-img';
    imagem.style.maxWidth = '100%';
    imagem.style.borderRadius = '8px';
    wrapper.replaceWith(imagem);
  });
  return copia.innerHTML;
}
