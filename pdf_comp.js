/**
 * pdf_comp.js — Envia dados do comparativo para o backend Python gerar o PDF.
 */
function gerarPDFComparativo() {
    try {
        // ── Coleta dados do DOM ──
        var fin = window._caixaFinData || {};

        var el = function (id) { return document.getElementById(id); };
        var txt = function (id) { var e = el(id); return e ? e.textContent.trim() : ''; };
        var val = function (id) { var e = el(id); return e ? e.value : ''; };

        // Admin
        var adminEl = el('compAdministradora');
        var adminName = adminEl ? adminEl.options[adminEl.selectedIndex].text : 'Porto Seguro';

        // Valor do imóvel
        var valorImovel = fin.valorImovel || fin.novoValorImovel || 0;
        var valorImovelFmt = (typeof fmtBRL === 'function') ? fmtBRL(valorImovel) : 'R$ ' + valorImovel.toLocaleString('pt-BR');

        // Financiamento
        var finValorFinanciado = txt('cxValorFinanciado') || 'R$ 0,00';
        var finPrazo = txt('cxPrazo') || '420 meses';
        var finParcela1 = txt('cxParcela1') || 'R$ 0,00';
        var finParcelaF = txt('cxParcelaFinal') || 'R$ 0,00';
        var finSistema = txt('cxSistema') || 'SAC';
        var finTotalJuros = txt('cxTotalJuros') || 'R$ 0,00';
        var finTotalPago = txt('cxTotalPago') || 'R$ 0,00';

        // Consórcio
        var conPrazo = (val('compPrazoGrupo') || '200') + ' meses';
        var conParcela = txt('compParcelaCon') || 'R$ 0,00';
        var conLanceRaw = val('compLancePagar');
        var conLance = (conLanceRaw && parseCurrency(conLanceRaw) > 0) ? ('R$ ' + conLanceRaw) : 'R$ 0,00';

        var adesaoEl = el('compAdesaoConDisplay');
        var adesaoVal = (adesaoEl && adesaoEl.parentElement.style.display !== 'none') ? adesaoEl.textContent.trim() : '';


        // Barras
        var barFinVal = txt('barValFin') || 'R$ 0';
        var barConVal = txt('barValCon') || 'R$ 0';
        // Percentuais das barras
        var barFinEl = el('barFin');
        var barConEl = el('barCon');
        var barFinPct = 1.0;
        var barConPct = 0.5;
        if (barFinEl && barConEl) {
            var wFin = parseFloat(barFinEl.style.width) || 100;
            var wCon = parseFloat(barConEl.style.width) || 50;
            barFinPct = wFin / 100;
            barConPct = wCon / 100;
        }

        // Economia
        var economiaVal = txt('compEcoPuroVal') || 'R$ 0,00';
        var economiaMeses = txt('compDiffMeses') || '0 meses';

        // Aluguel
        var aluguelEl = el('compCustoAluguelCon');
        var aluguel = aluguelEl ? aluguelEl.textContent.trim() : '';

        // Data
        var now = new Date();
        var dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // ── Payload ──
        var payload = {
            adminName: adminName,
            valorImovel: valorImovelFmt,
            finValorFinanciado: finValorFinanciado,
            finPrazo: finPrazo,
            finParcela1: finParcela1,
            finParcelaF: finParcelaF,
            finSistema: finSistema,
            finTotalJuros: finTotalJuros,
            finTotalPago: finTotalPago,
            conPrazo: conPrazo,
            conParcela: conParcela,
            conLance: conLance,
            barFinVal: barFinVal,
            barConVal: barConVal,
            barFinPct: barFinPct,
            barConPct: barConPct,
            economiaVal: economiaVal,
            economiaMeses: economiaMeses,
            aluguel: aluguel,
            adesao: adesaoVal,
            dateStr: dateStr
        };

        // ── GERAÇÃO LOCAL VIA HTML2PDF ──
        if (typeof html2pdf === 'undefined') {
            alert('Carregando biblioteca PDF... Aguarde um instante e tente novamente.');
            return;
        }

        const d = (typeof adminData !== 'undefined') ? adminData[val('compAdministradora') || 'porto_seguro'] : null;
        const headerLogoSrc = (typeof logoBase64 !== 'undefined' && logoBase64['logo-nova.png']) ? logoBase64['logo-nova.png'] : 'logo-nova.png';

        const element = document.createElement('div');
        element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            *{margin:0;padding:0;box-sizing:border-box}
            #pdf-content{font-family:'Inter',sans-serif;background:#fff;color:#111;padding:10mm 12mm 12mm;width:210mm;height:295mm;position:relative;box-sizing:border-box}
            .pdf-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #c9a84c}
            .pdf-header img{height:90px;object-fit:contain}
            .pdf-info{text-align:right}
            .pdf-info h1{font-size:22px;font-weight:800;color:#111;letter-spacing:-0.5px;margin-bottom:2px}
            .pdf-info p{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px}

            .main-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
            
            .card{background:#fdfcf8;border:1px solid #eee;border-radius:10px;padding:16px}
            .card h3{font-size:12px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #eee;padding-bottom:8px}
            
            .row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f5f5f5}
            .row:last-child{border:none;margin:0;padding:0}
            .row .lbl{font-size:11px;color:#666;font-weight:500;text-transform:uppercase}
            .row .val{font-size:14px;font-weight:700;color:#111}
            .val.highlight{color:#d32f2f}
            .val.good{color:#2e7d32}

            .economy-box{background:linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%);border:1px solid #c9a84c;border-radius:10px;padding:20px;text-align:center;margin-top:20px}
            .economy-box h2{font-size:14px;color:#8a7333;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
            .economy-box .eco-val{font-size:32px;font-weight:800;color:#111;margin-bottom:4px}
            .economy-box .eco-sub{font-size:16px;font-weight:600;color:#333}
            
            .footer{position:absolute;bottom:3mm;left:12mm;right:12mm;padding-top:6px;border-top:1px solid #eee;font-size:9px;color:#bbb;display:flex;justify-content:space-between}
        </style>
        
        <div id="pdf-content">
            <div class="pdf-header">
                <img src="${headerLogoSrc}" alt="CR Invest">
                <div class="pdf-info">
                    <h1>Comparativo Inteligente</h1>
                    <p>Financiamento vs Consórcio</p>
                    <p style="margin-top:4px; font-weight:700;color:#111">Imóvel: ${payload.valorImovel}</p>
                </div>
            </div>

            <div class="main-grid">
                <!-- FINANCIAMENTO -->
                <div class="card">
                    <h3>Financiamento Bancário</h3>
                    <div class="row">
                        <span class="lbl">Valor Financiado</span>
                        <span class="val">${payload.finValorFinanciado}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Prazo</span>
                        <span class="val">${payload.finPrazo}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Sistema</span>
                        <span class="val">${payload.finSistema}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">1ª Parcela</span>
                        <span class="val">${payload.finParcela1}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Última Parcela</span>
                        <span class="val">${payload.finParcelaF}</span>
                    </div>
                    <div class="row" style="margin-top:15px; background:#fff0f0; padding:10px; border-radius:6px">
                        <span class="lbl" style="color:#d32f2f">Total de Juros</span>
                        <span class="val highlight">${payload.finTotalJuros}</span>
                    </div>
                    <div class="row" style="background:#fffcfc; padding:10px; border-radius:6px">
                        <span class="lbl">Custo Final</span>
                        <span class="val">${payload.finTotalPago}</span>
                    </div>
                </div>

                <!-- CONSÓRCIO -->
                <div class="card">
                    <h3>Consórcio (${payload.adminName})</h3>
                    <div class="row">
                        <span class="lbl">Carta de Crédito</span>
                        <span class="val">${payload.valorImovel}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Prazo</span>
                        <span class="val">${payload.conPrazo}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Parcela Mensal</span>
                        <span class="val">${payload.conParcela}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Lance Sugerido</span>
                        <span class="val">${payload.conLance}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Taxa de Adesão</span>
                        <span class="val">${payload.adesao || '-'}</span>
                    </div>
                    <div class="row">
                        <span class="lbl">Custo de Aluguel (Espera)</span>
                        <span class="val">${payload.aluguel || '-'}</span>
                    </div>
                    <div class="row" style="margin-top:15px; background:#f0fff0; padding:10px; border-radius:6px">
                        <span class="lbl" style="color:#2e7d32">Custo Final Estimado</span>
                        <span class="val good">${payload.barConVal}</span>
                    </div>
                </div>
            </div>

            <!-- ECONOMIA -->
            <div class="economy-box">
                <h2>Economia Real ao Escolher o Consórcio</h2>
                <div class="eco-val">${payload.economiaVal}</div>
                <div class="eco-sub">${payload.economiaMeses} mais rápido que o banco.</div>
            </div>

            <div class="footer">
                <span>Simulação Comparativa • Valores e taxas sujeitos a alteração</span>
                <span>Gerado em: ${payload.dateStr}</span>
            </div>
        </div>`;

        const opt = {
            margin: 0,
            filename: `Comparativo_Financiamento_vs_Consorcio_${payload.adminName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();

    } catch (e) {
        console.error('Erro gerarPDFComparativo:', e);
        alert('Erro ao gerar relatorio: ' + e.message);
    }
}
