const config = window.OCORRENCIAS_CONFIG || {};
const form = document.querySelector('#ocorrenciaForm');
const submitButton = document.querySelector('#submitButton');
const successPanel = document.querySelector('#successPanel');
const formHint = document.querySelector('#formHint');

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
  form.hidden = false;
  successPanel.hidden = true;
  formHint.textContent = 'O Estado não é preenchido neste formulário; será calculado na base de dados.';
  updateProgress();
});

setToday();
updateProgress();