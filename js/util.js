/* ========================================
   FinancasApp - Utilitários compartilhados
======================================== */

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatarMoeda(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataBR(dataISO) {
  if (!dataISO) return '';
  // Aceita tanto "2026-08-20" quanto "2026-08-20T03:00:00.000Z"
  const dataSomente = String(dataISO).split('T')[0];
  const [ano, mes, dia] = dataSomente.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Garante que só chega nas páginas internas quem tem uma senha guardada.
// Não é uma segurança "de verdade" (quem sabe o link do Apps Script e a
// senha acessa igual) — é só pra não deixar a tela abrir sem dados.
function protegerPagina() {
  if (!Api.getSenha()) {
    window.location.href = '../index.html';
  }
}

function renderizarNav(paginaAtiva) {
  const nav = document.getElementById('nav-app');
  if (!nav) return;

  const itens = [
    { id: 'dashboard', href: 'dashboard.html', icone: '📊', rotulo: 'Resumo' },
    { id: 'contas', href: 'contas.html', icone: '📋', rotulo: 'Contas' },
    { id: 'modelos', href: 'modelos.html', icone: '🔁', rotulo: 'Fixas' },
    { id: 'categorias', href: 'categorias.html', icone: '🏷️', rotulo: 'Categorias' }
  ];

  nav.className = 'nav-app';
  nav.innerHTML = itens.map((item) => `
    <a href="${item.href}" class="${item.id === paginaAtiva ? 'ativo' : ''}">
      <span class="icone">${item.icone}</span>
      <span>${item.rotulo}</span>
    </a>
  `).join('');
}

// Busca as categorias uma vez e mantém em memória durante a navegação
// na mesma página (evita repetir a chamada em cada render).
let _cacheCategorias = null;

async function obterCategorias() {
  if (_cacheCategorias) return _cacheCategorias;
  const resposta = await Api.get('categorias');
  _cacheCategorias = resposta.sucesso ? resposta.dados : [];
  return _cacheCategorias;
}

function nomeCategoria(categorias, categoriaId) {
  const categoria = categorias.find((c) => Number(c.id) === Number(categoriaId));
  return categoria ? categoria.nome : 'Sem categoria';
}
