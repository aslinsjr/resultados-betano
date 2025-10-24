const API_URL = 'https://api-resultados-betano.vercel.app/api';

        function mudarAba(aba) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(aba).classList.add('active');

            if (aba === 'estatisticas' && document.getElementById('statsContent').style.display === 'none') {
                carregarEstatisticas();
            }
        }

        async function carregarResultados() {
            try {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('tabelaResultados').style.display = 'none';

                const stats = await fetch(`${API_URL}/estatisticas`).then(r => r.json());
                document.getElementById('totalJogos').textContent = stats.total_jogos;
                document.getElementById('ultimaAtualizacao').textContent = 
                    new Date(stats.ultima_extracao).toLocaleString('pt-BR');

                const response = await fetch(`${API_URL}/resultados`);
                const data = await response.json();

                // Função para converter horário HH:MM em minutos
                const horarioParaMinutos = (horario) => {
                    if (!horario) return 0;
                    const partes = horario.split(':');
                    return parseInt(partes[0]) * 60 + parseInt(partes[1] || 0);
                };

                // Ordenar por data_extracao (mais recente primeiro) e depois por horário
                data.dados.sort((a, b) => {
                    const dataA = new Date(a.data_extracao);
                    const dataB = new Date(b.data_extracao);
                    
                    // Comparar datas (dia)
                    const diaA = dataA.toDateString();
                    const diaB = dataB.toDateString();
                    
                    if (diaA !== diaB) {
                        return dataB - dataA; // Mais recente primeiro
                    }
                    
                    // Mesma data, ordenar por horário (crescente)
                    return horarioParaMinutos(a.horario) - horarioParaMinutos(b.horario);
                });

                const tbody = document.getElementById('tbody');
                tbody.innerHTML = '';

                data.dados.forEach(jogo => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${jogo.horario}</td>
                        <td>${jogo.time_casa}</td>
                        <td class="placar">${jogo.placar_final}</td>
                        <td>${jogo.time_fora}</td>
                        <td>${jogo.placar_intervalo}</td>
                        <td>${new Date(jogo.data_extracao).toLocaleString('pt-BR')}</td>
                    `;
                    tbody.appendChild(tr);
                });

                document.getElementById('loading').style.display = 'none';
                document.getElementById('tabelaResultados').style.display = 'table';

            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao carregar. Verifique se a API está rodando.');
                document.getElementById('loading').style.display = 'none';
            }
        }

        async function carregarEstatisticas() {
            try {
                document.getElementById('loadingStats').style.display = 'block';
                document.getElementById('statsContent').style.display = 'none';

                const [statsGerais, statsGols] = await Promise.all([
                    fetch(`${API_URL}/estatisticas`).then(r => r.json()),
                    fetch(`${API_URL}/estatisticas/gols`).then(r => r.json())
                ]);

                // Estatísticas gerais
                document.getElementById('totalGols').textContent = statsGerais.estatisticas_gols.total_gols;
                document.getElementById('mediaGols').textContent = statsGerais.estatisticas_gols.media_gols_por_jogo.toFixed(2);
                document.getElementById('jogosAnalisados').textContent = statsGerais.estatisticas_gols.jogos_analisados;
                document.getElementById('seqMenor3').textContent = statsGerais.estatisticas_gols.maior_sequencia_menor_3_gols;
                document.getElementById('seqMaior3').textContent = statsGerais.estatisticas_gols.maior_sequencia_maior_ou_igual_3_gols;

                // Percentuais
                document.getElementById('under25').textContent = statsGols.percentuais.jogos_under_2_5;
                document.getElementById('over25').textContent = statsGols.percentuais.jogos_over_2_5;

                // Distribuição
                const dist = statsGols.distribuicao_gols;
                const distribuicaoHtml = Object.entries(dist).map(([key, value]) => `
                    <div class="dist-bar">
                        <div class="label">${key.replace('_', ' ')}</div>
                        <div class="value">${value}</div>
                    </div>
                `).join('');
                document.getElementById('distribuicao').innerHTML = distribuicaoHtml;

                // Sequência < 3 gols
                document.getElementById('seqMenorTamanho').textContent = statsGols.sequencias.maior_sequencia_menor_3_gols.tamanho;
                const seqMenorHtml = statsGols.sequencias.maior_sequencia_menor_3_gols.jogos.map(jogo => `
                    <div class="sequence-item">
                        <strong>${jogo.jogo}</strong> - ${jogo.gols} gols
                        <br><small>${jogo.horario || 'Horário não disponível'}</small>
                    </div>
                `).join('');
                document.getElementById('seqMenorDetalhes').innerHTML = seqMenorHtml || '<p style="color: #888;">Nenhum jogo na sequência</p>';

                // Sequência ≥ 3 gols
                document.getElementById('seqMaiorTamanho').textContent = statsGols.sequencias.maior_sequencia_maior_ou_igual_3_gols.tamanho;
                const seqMaiorHtml = statsGols.sequencias.maior_sequencia_maior_ou_igual_3_gols.jogos.map(jogo => `
                    <div class="sequence-item">
                        <strong>${jogo.jogo}</strong> - ${jogo.gols} gols
                        <br><small>${jogo.horario || 'Horário não disponível'}</small>
                    </div>
                `).join('');
                document.getElementById('seqMaiorDetalhes').innerHTML = seqMaiorHtml || '<p style="color: #888;">Nenhum jogo na sequência</p>';

                document.getElementById('loadingStats').style.display = 'none';
                document.getElementById('statsContent').style.display = 'block';

            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao carregar estatísticas. Verifique se a API está rodando.');
                document.getElementById('loadingStats').style.display = 'none';
            }
        }

        async function abrirModalIA() {
            const modal = document.getElementById('modalIA');
            const loading = document.getElementById('loadingIA');
            const content = document.getElementById('contentIA');
            
            modal.style.display = 'block';
            loading.style.display = 'block';
            content.innerHTML = '';

            try {
                const response = await fetch(`${API_URL}/estatisticas/previsao-ia`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                loading.style.display = 'none';
                
                // Estatísticas base
                let html = `
                    <div class="stats-base">
                        <p><strong>Total de jogos:</strong> ${data.estatisticas_base.total_jogos}</p>
                        <p><strong>Média de gols:</strong> ${data.estatisticas_base.media_gols}</p>
                        <p><strong>Under 2.5:</strong> ${data.estatisticas_base.under_25}</p>
                        <p><strong>Over 2.5:</strong> ${data.estatisticas_base.over_25}</p>
                    </div>
                `;

                // Análise da tendência
                if (data.analise_ia.analise_tendencia) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">📊 Análise de Tendência</h3>
                        <div class="analysis-text">${data.analise_ia.analise_tendencia}</div>
                    `;
                }

                // Jogo 1
                if (data.analise_ia.jogo_1) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">🎯 Jogo 1</h3>
                        <div class="prediction-card">
                            <div class="previsao-tipo">${data.analise_ia.jogo_1.previsao}</div>
                            <span class="confidence ${data.analise_ia.jogo_1.confianca}">Confiança: ${data.analise_ia.jogo_1.confianca}</span>
                            <p style="margin-top: 10px;">${data.analise_ia.jogo_1.justificativa}</p>
                        </div>
                    `;
                }

                // Cenário A
                if (data.analise_ia.cenario_a) {
                    html += `
                        <h3 style="color: #FFC107; margin: 30px 0 10px 0;">🔸 ${data.analise_ia.cenario_a.condicao}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="prediction-card" style="border-left-color: #FFC107;">
                                <h4>Jogo 2</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_a.jogo_2.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_a.jogo_2.confianca}">Confiança: ${data.analise_ia.cenario_a.jogo_2.confianca}</span>
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_a.jogo_2.justificativa}</p>
                            </div>
                            <div class="prediction-card" style="border-left-color: #FFC107;">
                                <h4>Jogo 3</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_a.jogo_3.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_a.jogo_3.confianca}">Confiança: ${data.analise_ia.cenario_a.jogo_3.confianca}</span>
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_a.jogo_3.justificativa}</p>
                            </div>
                        </div>
                    `;
                }

                // Cenário B
                if (data.analise_ia.cenario_b) {
                    html += `
                        <h3 style="color: #2196F3; margin: 30px 0 10px 0;">🔹 ${data.analise_ia.cenario_b.condicao}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="prediction-card" style="border-left-color: #2196F3;">
                                <h4>Jogo 2</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_b.jogo_2.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_b.jogo_2.confianca}">Confiança: ${data.analise_ia.cenario_b.jogo_2.confianca}</span>
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_b.jogo_2.justificativa}</p>
                            </div>
                            <div class="prediction-card" style="border-left-color: #2196F3;">
                                <h4>Jogo 3</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_b.jogo_3.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_b.jogo_3.confianca}">Confiança: ${data.analise_ia.cenario_b.jogo_3.confianca}</span>
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_b.jogo_3.justificativa}</p>
                            </div>
                        </div>
                    `;
                }
                
                // Fallback para formato antigo
                if (data.analise_ia.previsoes && data.analise_ia.previsoes.length > 0) {
                    html += `<h3 style="color: #4CAF50; margin: 20px 0 10px 0;">🎯 Previsões</h3>`;
                    data.analise_ia.previsoes.forEach(prev => {
                        html += `
                            <div class="prediction-card">
                                <h4>Jogo ${prev.jogo}</h4>
                                <div class="previsao-tipo">${prev.previsao}</div>
                                <span class="confidence ${prev.confianca}">Confiança: ${prev.confianca}</span>
                                <p style="margin-top: 10px;">${prev.justificativa}</p>
                            </div>
                        `;
                    });
                }

                // Aviso se houver
                if (data.analise_ia.aviso) {
                    html += `
                        <div style="background: #FF5722; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            ⚠️ ${data.analise_ia.aviso}
                        </div>
                    `;
                }

                content.innerHTML = html;

            } catch (error) {
                loading.style.display = 'none';
                content.innerHTML = `
                    <div style="background: #FF5722; padding: 20px; border-radius: 8px; text-align: center;">
                        <h3>❌ Erro ao carregar previsão</h3>
                        <p style="margin-top: 10px;">${error.message}</p>
                        <p style="margin-top: 10px; font-size: 14px; color: #ffcccc;">
                            Verifique se a GROK_API_KEY está configurada no servidor.
                        </p>
                    </div>
                `;
            }
        }

        function fecharModalIA() {
            document.getElementById('modalIA').style.display = 'none';
        }

        // Fechar modal clicando fora
        window.onclick = function(event) {
            const modal = document.getElementById('modalIA');
            if (event.target == modal) {
                fecharModalIA();
            }
        }

        carregarResultados();
        setInterval(carregarResultados, 6000);