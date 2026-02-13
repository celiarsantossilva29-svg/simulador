// ========================================
// SIMULADOR DE CONSÓRCIO - CR INVEST
// ========================================

let currentMode = 'integral'; // 'integral' | 'reduzida'

// ========================================
// ADMIN DATA & LOGOS
// ========================================

const adminData = {
    porto_seguro: { name: 'Porto Seguro', color: '#003399', logo: 'logo-porto.png', logoH: 70 },
    embracon: { name: 'Embracon', color: '#E30613', logo: 'logo-embracon.png', logoH: 32 },
    rodobens: { name: 'Rodobens', color: '#1B4D3E', logo: 'logo-rodobens.png', logoH: 50 },
    canopus: { name: 'Canopus', color: '#1B3A6B', logo: 'logo-canopus.png', logoH: 70 },
    magalu: { name: 'Magalu Consórcio', color: '#0086FF', logo: '', logoH: 50 }
};

// STATE PERSISTENCE
let currentAdmin = 'porto_seguro'; // Initial default
const savedRates = {
    porto_seguro: { taxa: '15', fundo: '2', seguro: '0.04' },
    embracon: { taxa: '24.8', fundo: '2', seguro: '0' },
    rodobens: { taxa: '15', fundo: '2', seguro: '0' },
    canopus: { taxa: '18', fundo: '2', seguro: '0' },
    magalu: { taxa: '16', fundo: '2', seguro: '0' }
};

function trocarAdministradora() {
    // 1. Save current state
    const taxaInput = document.getElementById('taxaAdm');
    const fundoInput = document.getElementById('fundoReserva');
    const seguroInput = document.getElementById('seguroPrestamista');

    if (currentAdmin) {
        if (!savedRates[currentAdmin]) savedRates[currentAdmin] = {};
        savedRates[currentAdmin] = {
            taxa: taxaInput.value,
            fundo: fundoInput.value,
            seguro: seguroInput.value
        };
    }

    const sel = document.getElementById('administradora');
    const key = sel.value;

    // 2. Load new state (if exists, else defaults or keep input?)
    // Using defined defaults ensures clean switching.
    if (savedRates[key]) {
        taxaInput.value = savedRates[key].taxa;
        fundoInput.value = savedRates[key].fundo;
        seguroInput.value = savedRates[key].seguro;
    }

    currentAdmin = key;

    // 3. Update Logo
    const d = adminData[key];
    const container = document.getElementById('adminLogoContainer');
    if (d && d.logo) {
        container.innerHTML = `<img src="${d.logo}" alt="${d.name}" class="admin-logo-img" style="height:${d.logoH}px">
        <img src="logo-nova.png" alt="CR Invest" style="height:80px; margin-left:15px; vertical-align:middle; opacity:0.8">`;
    } else if (d) {
        const initials = d.name.split(' ').map(w => w[0]).join('').substring(0, 2);
        container.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" style="vertical-align:middle">
            <rect width="28" height="28" rx="4" fill="${d.color}"/>
            <text x="14" y="15" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="10" font-weight="700" font-family="Inter,sans-serif">${initials}</text>
        </svg> <span class="admin-name" style="color:${d.color}">${d.name}</span>`;
    } else {
        container.innerHTML = '';
    }
    atualizarSeletorReducao();
    calcular();
}

let taxasVisible = false;

function toggleTaxas() {
    taxasVisible = !taxasVisible;
    const row = document.getElementById('taxasRow');
    row.style.display = taxasVisible ? 'grid' : 'none';
}

// ========================================
// MODE SWITCHING
// ========================================

function setMode(mode) {
    currentMode = mode;
    const btnI = document.getElementById('btnIntegral');
    const btnR = document.getElementById('btnReduzida');
    const antGroup = document.getElementById('antecipada-group');
    const antLabel = document.getElementById('antecipada-label');

    if (mode === 'integral') {
        btnI.classList.add('active');
        btnR.classList.remove('active');
        antGroup.style.display = '';
        antLabel.style.display = 'none';
    } else {
        btnI.classList.remove('active');
        btnR.classList.add('active');
        antGroup.style.display = '';
        antLabel.style.display = 'none';
    }
    atualizarSeletorReducao();
    calcular();
}

function atualizarSeletorReducao() {
    const container = document.getElementById('pctReducaoContainer');
    if (currentMode === 'reduzida') {
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

// ========================================
// FORMATTING UTILITIES
// ========================================

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(str) {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatCurrencyInput(input) {
    let raw = input.value.replace(/[^\d]/g, '');
    if (raw.length === 0) { input.value = ''; return; }
    let num = parseInt(raw) / 100;
    input.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ========================================
// MAIN CALCULATION
// ========================================

function calcular() {
    // Read inputs
    const taxaAdm = parseFloat(document.getElementById('taxaAdm').value) / 100 || 0;
    const fundoReserva = parseFloat(document.getElementById('fundoReserva').value) / 100 || 0;
    const seguro = parseFloat(document.getElementById('seguroPrestamista').value) || 0;
    const credito = parseCurrency(document.getElementById('valorCredito').value);
    const prazo = parseInt(document.getElementById('prazoGrupo').value) || 1;
    const reducao = document.querySelector('input[name="reducao"]:checked').value;
    const lanceEmbutidoPct = parseFloat(document.getElementById('lanceEmbutido').value) / 100 || 0;
    const lancePagarPct = parseFloat(document.getElementById('lancePagar').value) / 100 || 0;
    const lanceTotalPct = lanceEmbutidoPct + lancePagarPct;
    const primeirasN = parseInt(document.getElementById('primeirasN').value) || 1;
    const antecipadaPct = (parseFloat(document.getElementById('antecipada').value) || 0) / 100;

    const adminKey = document.getElementById('administradora').value;
    const isEmbracon = adminKey === 'embracon';

    // ========================================
    // PARCELA MENSAL (INTEGRAL)
    // ========================================
    const totalTaxas = taxaAdm + fundoReserva + seguro;
    const fatorTotal = 1 + totalTaxas;
    const parcelaMensal = (credito * fatorTotal) / prazo;

    // ========================================
    // PARCELA BASE (depends on mode)
    // ========================================
    let parcelaBase;
    if (currentMode === 'integral') {
        parcelaBase = parcelaMensal;
    } else {
        // Read reduction from input (e.g. 25 -> 0.25)
        const valRed = parseFloat(document.getElementById('pctReducao').value);
        const pctReducao = (isNaN(valRed) ? 25 : valRed) / 100;
        const fatorReducao = 1 - pctReducao;

        if (isEmbracon) {
            // Embracon: Crédito REDUZIDO, Fundo Reserva REDUZIDO, Taxa Adm INTEGRAL, Seguro INTEGRAL
            const partCredito = (credito * fatorReducao) / prazo;
            const partAdm = (credito * taxaAdm) / prazo;
            const partFundo = (credito * fundoReserva * fatorReducao) / prazo;
            const partSeguro = (credito * seguro) / prazo;

            parcelaBase = partCredito + partAdm + partFundo + partSeguro;
        } else {
            // Outros: Redução sobre a parcela cheia
            parcelaBase = parcelaMensal * fatorReducao;
        }
    }

    // ========================================
    // ANTECIPADA
    // ========================================
    const antecipadaTotal = credito * antecipadaPct;
    const antecipadaMensal = antecipadaTotal / primeirasN;

    // ========================================
    // PRIMEIRAS N PARCELAS
    // ========================================
    const primeiras = parcelaBase + antecipadaMensal;

    // ========================================
    // LANCE
    // ========================================
    let valorTotalLance, valorEmbutido;

    if (isEmbracon) {
        // Embracon: lance calculado sobre o crédito puro (sem taxas)
        valorTotalLance = lanceTotalPct * credito;
        valorEmbutido = lanceEmbutidoPct * credito;
    } else {
        // Outros: lance sobre plano total
        const planoTotal = parcelaMensal * prazo + antecipadaTotal;
        valorTotalLance = lanceTotalPct * planoTotal;
        valorEmbutido = currentMode === 'integral'
            ? lanceEmbutidoPct * credito
            : lanceEmbutidoPct * planoTotal;
    }

    const valorAPagar = valorTotalLance - valorEmbutido;

    // ========================================
    // CRÉDITO LÍQUIDO
    // ========================================
    const creditoLiquido = credito - valorEmbutido;

    // ========================================
    // PÓS-CONTEMPLAÇÃO (modelo padrão para todas as admins)
    // ========================================
    // Para pós-contemplação, usar fórmula padrão (mesmo modelo Porto Seguro)
    const parcelaBasePos = currentMode === 'integral' ? parcelaMensal : parcelaMensal * 0.75;
    let prazoRestante, parcelaPosContemp;

    if (reducao === 'parcela') {
        // Mantém prazo, reduz parcela
        prazoRestante = prazo - 1;
        const totalPlanoRegular = parcelaMensal * prazo;

        let custoRestante;
        if (currentMode === 'integral') {
            custoRestante = totalPlanoRegular - valorTotalLance - primeiras;
        } else {
            custoRestante = totalPlanoRegular - valorTotalLance - parcelaBasePos - antecipadaTotal;
        }
        parcelaPosContemp = custoRestante / prazoRestante;
    } else {
        // Mantém parcela, reduz prazo
        const totalPlano = parcelaMensal * prazo;
        let custoRestantePrazo;
        if (currentMode === 'integral') {
            custoRestantePrazo = totalPlano - valorTotalLance - primeiras;
        } else {
            custoRestantePrazo = totalPlano - valorTotalLance - parcelaBasePos - antecipadaTotal;
        }
        prazoRestante = Math.round(custoRestantePrazo / parcelaBasePos);
        parcelaPosContemp = parcelaBasePos;
    }

    // ========================================
    // UPDATE DISPLAY: Lance section
    // ========================================
    document.getElementById('lanceTotal').value = (lanceTotalPct * 100).toFixed(2).replace('.', ',');
    document.getElementById('valorEmbutido').value = formatCurrency(valorEmbutido);
    document.getElementById('valorPagar').value = formatCurrency(valorAPagar);
    document.getElementById('valorTotal').value = formatCurrency(valorTotalLance);

    // ========================================
    // UPDATE DISPLAY: Results (now using .value since they are input fields)
    // ========================================
    document.getElementById('resultPrimeiras').value = formatCurrency(primeiras);
    document.getElementById('resultDemais').value = formatCurrency(parcelaBase);
    document.getElementById('resultCredLiquido').value = formatCurrency(creditoLiquido);
    document.getElementById('resultPosContemp').value = formatCurrency(parcelaPosContemp);
    document.getElementById('resultPrazoRestante').value = prazoRestante;
}

// ========================================
// PDF GENERATION
// ========================================

function gerarPDF() {
    if (typeof html2pdf === 'undefined') {
        alert('Carregando biblioteca PDF... Aguarde um instante e tente novamente.');
        // Retry logic could go here, but alert is enough for now.
        return;
    }
    try {
        const admin = document.getElementById('administradora');
        const adminKey = admin.value;
        const adminName = admin.options[admin.selectedIndex].text;
        const observacoes = document.getElementById('observacoes').value;
        const d = adminData[adminKey];
        // Use Base64 logos if available to avoid Tainted Canvas
        const adminLogoSrc = (d && d.logo && logoBase64[d.logo]) ? logoBase64[d.logo] : (d ? d.logo : '');
        const headerLogoSrc = logoBase64['logo-nova.png'] || 'logo-nova.png';

        const adminColor = d ? d.color : '#333';

        const tipo = document.getElementById('tipoBem');
        const tipoText = tipo.options[tipo.selectedIndex].text;

        let modeLabel = currentMode === 'integral' ? 'Parcela Integral' : 'Parcela Reduzida';
        if (currentMode === 'reduzida') {
            const valRed = parseFloat(document.getElementById('pctReducao').value) || 25;
            // User requested to show the reduction percentage itself as "X% until contemplation"
            // Example: "25% até a Contemplação" (meaning paying 75%? Or paying 25%? User wording is key.)
            // The prompt says: "se a redução é de 25% ent quero que escreva 25% ate a contemplação"
            // So we use 'valRed' directly.
            modeLabel += ` (${valRed}% até Contemplação)`;
        }
        const primeirasN = document.getElementById('primeirasN').value;
        const primeirasLabel = primeirasN === '1' ? 'À Vista' : primeirasN;

        const taxaAdm = document.getElementById('taxaAdm').value;
        const fundoReserva = document.getElementById('fundoReserva').value;
        const seguro = document.getElementById('seguroPrestamista');
        const seguroVal = parseFloat(seguro.value) || 0;
        const seguroText = seguroVal === 0 ? 'Sem Seguro' : seguroVal + '%';
        const credito = document.getElementById('valorCredito').value;
        const prazo = document.getElementById('prazoGrupo').value;

        const lanceEmb = document.getElementById('lanceEmbutido').value;
        const valorEmb = document.getElementById('valorEmbutido').value;
        const lancePag = document.getElementById('lancePagar').value;
        const valorPag = document.getElementById('valorPagar').value;
        const lanceTotal = document.getElementById('lanceTotal').value;
        const valorTotal = document.getElementById('valorTotal').value;

        const resultPrim = document.getElementById('resultPrimeiras').value;
        const resultDemais = document.getElementById('resultDemais').value;
        const resultCL = document.getElementById('resultCredLiquido').value;
        const resultPos = document.getElementById('resultPosContemp').value;
        const resultPrazo = document.getElementById('resultPrazoRestante').value;

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Build the content for PDF
        const element = document.createElement('div');
        element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            *{margin:0;padding:0;box-sizing:border-box}
            #pdf-content{font-family:'Inter',sans-serif;background:#fff;color:#111;padding:40px 50px;width:100%}
            .pdf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-bottom:20px;border-bottom:2px solid #c9a84c}
            .pdf-header img{height:160px;object-fit:contain}
            .pdf-info{text-align:right}
            .pdf-info h1{font-size:24px;font-weight:800;color:#111;letter-spacing:-0.5px;margin-bottom:4px}
            .pdf-info p{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px}

            /* MAIN GRID */
            .main-grid{display:grid;grid-template-columns:1.2fr 1.8fr;gap:40px}

            /* CARDS */
            .card{margin-bottom:24px}
            .card h3{font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:8px}
            .card h3::after{content:'';flex:1;height:1px;background:#eee}

            /* SUMMARY BOX (CREDIT + TERM) */
            .summary-box{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f9f9f9;padding:20px;border-radius:8px;margin-bottom:32px;border:1px solid #eee}
            .s-item .lbl{display:block;font-size:11px;color:#888;margin-bottom:4px;text-transform:uppercase}
            .s-item .val{display:block;font-size:20px;font-weight:700;color:#111}

            /* LANCE (LIGHT) */
            .lance-card{background:#fff;color:#111;padding:24px;border-radius:10px;border:1px solid #ddd}
            .lance-card h3{color:#c9a84c;border:none;margin-bottom:16px}
            .lance-card h3::after{background:#eee}
            .l-row{display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;border-bottom:1px solid #f0f0f0;padding-bottom:10px}
            .l-row:last-child{border:none;margin:0;padding:0}
            .l-row .lbl{color:#666}
            .l-row .val{font-weight:600;color:#111}

            /* RESULTS */
            .result-card{background:#fff}
            .r-row{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0f0f0}
            .r-row:last-child{border:none}
            .r-label{font-size:13px;color:#666;max-width:60%}
            .r-val{font-size:18px;font-weight:700;color:#111;text-align:right}
            .r-sub{font-size:11px;color:#999;display:block;margin-top:2px}

            /* HIGHLIGHT LIQUID */
            .highlight-liquid{background:linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%);border:1px solid #c9a84c;padding:20px;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
            .hl-label{font-size:14px;font-weight:700;color:#8a7333;text-transform:uppercase}
            .hl-val{font-size:26px;font-weight:800;color:#111}

            .admin-tag{display:inline-block;margin-top:8px}

            .footer{margin-top:60px;pt:20px;border-top:1px solid #eee;font-size:10px;color:#ccc;display:flex;justify-content:space-between}
        </style>
        
        <div id="pdf-content">
            <div class="pdf-header">
                <img src="${headerLogoSrc}" alt="CR Invest">
                <div class="pdf-info">
                    <h1>Simulação de Consórcio</h1>
                    <p>${modeLabel} • ${tipoText}</p>
                    <div class="admin-tag">
                        ${adminLogoSrc ? `<img src="${adminLogoSrc}" style="height:60px;object-fit:contain">` : `<span style="font-weight:700;color:${adminColor}">${adminName}</span>`}
                    </div>
                </div>
            </div>

            <!-- TOP SUMMARY: CREDIT & TERM -->
            <div class="summary-box">
                <div class="s-item">
                    <span class="lbl">Valor do Crédito</span>
                    <span class="val">R$ ${credito}</span>
                </div>
                <div class="s-item">
                    <span class="lbl">Prazo do Plano</span>
                    <span class="val">${prazo} Meses</span>
                </div>
            </div>

            <div class="main-grid">
                <!-- LEFT COLUMN: LANCE -->
                <div>
                    <div class="lance-card">
                        <h3>Composição do Lance</h3>
                        <div class="l-row"><span class="lbl">Embutido (${lanceEmb}%)</span><span class="val">R$ ${valorEmb}</span></div>
                        <div class="l-row"><span class="lbl">Recurso Próprio (${lancePag}%)</span><span class="val">R$ ${valorPag}</span></div>
                        <div class="l-row" style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.2)">
                            <span class="lbl" style="color:#c9a84c">Lance Total (${lanceTotal}%)</span>
                            <span class="val" style="color:#c9a84c;font-size:16px">R$ ${valorTotal}</span>
                        </div>
                    </div>
                </div>

                <!-- RIGHT COLUMN: RESULTS -->
                <div>
                    <div class="card">
                        <h3>Fluxo de Pagamento</h3>
                        
                        <div class="r-row">
                            <div class="r-label">1ª Parcela (${primeirasLabel})
                                <span class="r-sub">Entrada (Antecipada + Parcela)</span>
                            </div>
                            <div class="r-val">R$ ${resultPrim}</div>
                        </div>

                        <div class="r-row">
                            <div class="r-label">Parcelas Antes da Contemplação
                                <span class="r-sub">Valor mensal até sair o lance</span>
                            </div>
                            <div class="r-val">R$ ${resultDemais}</div>
                        </div>

                        <div class="highlight-liquid" style="margin:24px 0">
                            <span class="hl-label">Crédito Líquido</span>
                            <span class="hl-val">R$ ${resultCL}</span>
                        </div>

                        <div class="r-row">
                            <div class="r-label">Parcelas Pós-Contemplação
                                <span class="r-sub">Novo valor após abater o lance</span>
                            </div>
                            <div class="r-val">R$ ${resultPos}</div>
                        </div>
                        
                        <div class="r-row" style="border:none">
                            <div class="r-label">Prazo Restante ao Contemplar</div>
                            <div class="r-val">${resultPrazo} Meses</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${observacoes ? `
            <div class="pdf-notes" style="margin-top:30px; padding-top:20px; border-top:1px solid #ddd;">
                <h3 style="font-size:14px; font-weight:700; margin-bottom:8px; color:#111; text-transform:uppercase;">Observações</h3>
                <p style="font-size:12px; line-height:1.5; color:#444; white-space:pre-wrap;">${observacoes}</p>
            </div>
            ` : ''}

            <div class="footer">
                <span>CR Invest - Consultoria Especializada</span>
                <span>Gerado em ${dateStr}</span>
            </div>
        </div>
    `;

        // Configuration for html2pdf
        const opt = {
            margin: 0,
            filename: 'Simulacao-CR-Invest.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Use html2pdf
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(element).save()
                .then(() => {
                    console.log('PDF gerado com sucesso!');
                })
                .catch(err => {
                    console.error('Erro na geração do PDF (Promise):', err);
                    alert('Erro ao gerar PDF: ' + (err.message || err));
                });
        } else {
            alert('Erro: Biblioteca de PDF não carregada. Tente novamente em alguns segundos.');
        }
    } catch (e) {
        console.error('Erro ao gerar PDF (Sync):', e);
        alert('Erro ao gerar PDF (Sync): ' + e.message);
    }
}

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    trocarAdministradora();
    calcular();
});
