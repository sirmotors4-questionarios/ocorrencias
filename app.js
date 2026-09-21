const config = window.OCORRENCIAS_CONFIG || {};
const form = document.querySelector('#ocorrenciaForm');
const submitButton = document.querySelector('#submitButton');
const successPanel = document.querySelector('#successPanel');
const formHint = document.querySelector('#formHint');
const syncStatus = document.querySelector('#syncStatus');
const routeSelect = document.querySelector('[data-list="rotas"]');
const sentidoSelect = document.querySelector('#sentidoSelect');
const routeDirections = new Map();

const ROUTE_ENDPOINTS = {
  1: ['Albazine', 'Baixa'],
  2: ['Tchumene', 'Baixa'],
  3: ['Casa Branca', 'UEM'],
  4: ['Marracuene', 'Baixa'],
  5: ['Matola Gare', 'Baixa'],
  6: ['Matola Gare', 'Museu'],
  7: ['Boane', 'Baixa'],
  8: ['Missão Roque', 'Museu'],
  9: ['Casa Branca', 'Museu'],
  10: ['Boane', 'Mozal'],
  11: ['Tchumene', 'Museu'],
  12: ['Marracuene', 'Museu'],
  13: ['Coca-Cola', 'Museu']
};

const normalise = value => String(value ?? '').trim();

function firstValue(item, keys) {
  if (typeof item === 'string') return normalise(item);
  const key = keys.find(candidate => normalise(item?.[candidate]));
  return key ? normalise(item[key]) : '';
}

function isActive(item) {
  if (typeof item === 'string') return true;
  const state = firstValue(item, [
    'Disponível', 'Disponivel', 'Disponibilidade', 'Activo', 'Ativo',
    'Estado', 'Estado Operacional', 'Status'
  ]).toLowerCase();
  if (!state) return true;
  return !['não', 'nao', 'inactivo', 'inativa', 'inativo', 'indisponível',
    'indisponivel', 'fora de serviço', 'fora de servico', 'desactivado',
    'desativado'].includes(state);
}

function escapeHtml(value) {
  return normalise(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[char]));
}

function fillSelect(key, items, keys) {
  const select = document.querySelector(`[data-list="${key}"]`);
  const values = (Array.isArray(items) ? items : [])
    .filter(isActive)
    .map(item => firstValue(item, keys))
    .filter(Boolean);
  const unique = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt'));
  select.innerHTML = '<option value="">Seleccionar</option>' + unique
    .map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('');
}

function getRouteEndpoints(item, value) {
  const origem = firstValue(item, ['Origem', 'origem']);
  const destino = firstValue(item, ['Destino', 'destino']);
  if (origem && destino) return [origem, destino];

  const routeNumber = Number.parseInt(value.match(/\d+/)?.[0] || '', 10);
  if (ROUTE_ENDPOINTS[routeNumber]) return ROUTE_ENDPOINTS[routeNumber];

  const separator = [' → ', ' - ', ' – ', ' — ', ' / ']
    .find(candidate => value.includes(candidate));
  if (!separator) return null;
  const parts = value.split(separator).map(normalise).filter(Boolean);
  return parts.length >= 2 ? [parts[0], parts.slice(1).join(separator)] : null;
}

function fillRoutes(items) {
  routeDirections.clear();
  const options = (Array.isArray(items) ? items : [])
    .filter(isActive)
    .map(item => {
      const value = firstValue(item, [
        'Nome da Rota', 'Rota', 'nome', 'Código da Rota',
        'Codigo da Rota', 'ID_Rota', 'codigo'
      ]);
      if (!value) return '';
      const endpoints = getRouteEndpoints(item, value);
      if (endpoints) routeDirections.set(value, endpoints);
      return `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`;
    })
    .join('');
  routeSelect.innerHTML = '<option value="">Seleccionar</option>' + options;
  updateSentidos();
}

function updateSentidos() {
  const endpoints = routeDirections.get(routeSelect.value);
  sentidoSelect.value = '';
  if (!routeSelect.value) {
    sentidoSelect.disabled = true;
    sentidoSelect.innerHTML = '<option value="">Seleccione primeiro a rota</option>';
  } else if (!endpoints) {
    sentidoSelect.disabled = true;
    sentidoSelect.innerHTML = '<option value="">Sentidos indisponíveis</option>';
  } else {
    const [origem, destino] = endpoints;
    const ida = `${origem} → ${destino}`;
    const volta = `${destino} → ${origem}`;
    sentidoSelect.disabled = false;
    sentidoSelect.innerHTML = '<option value="">Seleccionar</option>' +
      `<option value="${escapeHtml(ida)}">${escapeHtml(ida)}</option>` +
      `<option value="${escapeHtml(volta)}">${escapeHtml(volta)}</option>`;
  }
  updateProgress();
}

async function loadMasterData() {
  try {
    if (!config.masterDataUrl) throw new Error('Endpoint mestre não configurado.');
    const separator = config.masterDataUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${config.masterDataUrl}${separator}t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    fillSelect('viaturas', data.viaturas, [
      'Matrícula', 'Matricula', 'Matrícula da Viatura', 'Viatura', 'codigo'
    ]);
    fillSelect('motoristas', data.motoristas, [
      'Nome do Motorista', 'Motorista', 'Nome Completo', 'Nome', 'codigo'
    ]);
    fillRoutes(data.rotas);

    const updated = data.actualizadoEm ? new Date(data.actualizadoEm) : new Date();
    document.querySelector('#dataTimestamp').textContent =
      `Listas actualizadas: ${new Intl.DateTimeFormat('pt-MZ', {
        dateStyle: 'short', timeStyle: 'short'
      }).format(updated)}`;
    syncStatus.className = 'sync online';
    syncStatus.innerHTML = '<span></span>Dados actualizados';
  } catch (error) {
    console.error('Erro ao carregar dados mestre:', error);
    syncStatus.className = 'sync error';
    syncStatus.innerHTML = '<span></span>Listas indisponíveis';
    document.querySelectorAll('select[data-list]').forEach(select => {
      select.innerHTML = '<option value="">Lista indisponível</option>';
    });
    updateSentidos();
  }
}

function setToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  form.elements.data.value = local.toISOString().slice(0, 10);
  document.querySelector('#todayLabel').textContent = new Intl.DateTimeFormat('pt-MZ', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(now);
  document.querySelector('#dataTimestamp').textContent = new Intl.DateTimeFormat('pt-MZ', {
    dateStyle: 'short', timeStyle: 'short'
  }).format(now);
}

function updateProgress() {
  const required = [...form.querySelectorAll('[required]')];
  const complete = required.filter(field => String(field.value || '').trim()).length;
  const pct = required.length ? Math.round((complete / required.length) * 100) : 0;
  document.querySelector('#progressText').textContent = `${pct}%`;
  document.querySelector('#progressBar').style.width = `${pct}%`;
}

form.addEventListener('input', event => {
  event.target.classList.remove('invalid');
  updateProgress();
});

routeSelect.addEventListener('change', updateSentidos);

form.addEventListener('submit', async event => {
  event.preventDefault();

  const invalid = [...form.querySelectorAll('[required]')]
    .filter(field => !String(field.value || '').trim());

  if (invalid.length) {
    invalid.forEach(field => field.classList.add('invalid'));
    invalid[0].focus();
    formHint.textContent = 'Preencha todos os campos obrigatórios.';
    return;
  }

  const fd = new FormData(form);
  const payload = {
    data: fd.get('data'),
    hora: fd.get('hora'),
    tipo_ocorrencia: fd.get('tipo_ocorrencia'),
    categoria: fd.get('categoria'),
    viatura: fd.get('viatura'),
    motorista: fd.get('motorista'),
    rota: fd.get('rota') || '',
    sentido: fd.get('sentido') || '',
    local_ocorrencia: fd.get('local_ocorrencia'),
    descricao: fd.get('descricao'),
    criticidade: fd.get('criticidade'),
    impacto: fd.get('impacto'),
    viatura_imobilizada: fd.get('viatura_imobilizada'),
    operacao_interrompida: fd.get('operacao_interrompida'),
    passageiros_afectados: Number(fd.get('passageiros_afectados') || 0),
    houve_feridos: fd.get('houve_feridos'),
    houve_danos_materiais: fd.get('houve_danos_materiais')
  };

  submitButton.disabled = true;
  submitButton.querySelector('span').textContent = 'A enviar...';
  formHint.textContent = 'A enviar a ocorrência para o sistema...';

  try {
    if (config.submissionUrl && !config.demoMode) {
      const response = await fetch(config.submissionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const detalhe = await response.text();
        console.error('Resposta do Power Automate:', response.status, detalhe);
        throw new Error(`HTTP ${response.status}`);
      }
    } else {
      const entries = JSON.parse(localStorage.getItem('sirOcorrenciasDemo') || '[]');
      entries.push(payload);
      localStorage.setItem('sirOcorrenciasDemo', JSON.stringify(entries));
    }

    form.hidden = true;
    successPanel.hidden = false;
    document.querySelector('#successMessage').textContent = config.demoMode
      ? 'Modo de demonstração: o registo ficou guardado neste dispositivo.'
      : 'A ocorrência foi enviada para a base de dados com sucesso.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Erro no envio para Power Automate:', error);
    formHint.textContent = `Não foi possível enviar a ocorrência: ${error.message}`;
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector('span').textContent = 'Enviar ocorrência';
  }
});

document.querySelector('#newEntry').addEventListener('click', () => {
  form.reset();
  setToday();
  updateSentidos();
  form.hidden = false;
  successPanel.hidden = true;
  formHint.textContent = 'O Estado não é preenchido neste formulário; será calculado na base de dados.';
  updateProgress();
});

setToday();
loadMasterData();
updateProgress();
