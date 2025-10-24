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
                // Buscar dados de previsão IA e estatísticas de gols em paralelo
                const [responseIA, responseGols] = await Promise.all([
                    fetch(`${API_URL}/estatisticas/previsao-ia`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(`${API_URL}/estatisticas/gols`)
                ]);

                if (!responseIA.ok) {
                    throw new Error(`Erro ${responseIA.status}: ${responseIA.statusText}`);
                }

                const data = await responseIA.json();
                const statsGols = await responseGols.json();
                
                console.log('Data IA:', data);
                console.log('Stats Gols:', statsGols);

                // Calcular Under 1.5 (≤ 2 gols) e Over 3.5 (≥ 4 gols)
                let under15Count = 0;
                let over35Count = 0;
                const totalJogos = data.estatisticas_base.total_jogos;

                if (statsGols.distribuicao_gols) {
                    const dist = statsGols.distribuicao_gols;
                    // Under 1.5 = 0, 1 ou 2 gols
                    under15Count = (dist['0_gols'] || 0) + (dist['1_gol'] || 0) + (dist['2_gols'] || 0);
                    // Over 3.5 = 4+ gols
                    over35Count = (dist['4_gols'] || 0) + (dist['5_gols'] || 0) + (dist['6_ou_mais'] || 0);
                }

                // Adicionar aos dados
                data.estatisticas_base.under_15 = totalJogos > 0 
                    ? `${under15Count} jogos (${((under15Count/totalJogos)*100).toFixed(1)}%)`
                    : 'N/A';
                data.estatisticas_base.over_35 = totalJogos > 0 
                    ? `${over35Count} jogos (${((over35Count/totalJogos)*100).toFixed(1)}%)`
                    : 'N/A';
                
                loading.style.display = 'none';
                
                // === NÍVEL DE CONFIANÇA GERAL ===
                let html = '';
                if (data.analise_ia.nivel_confianca_geral) {
                    const nivelClass = data.analise_ia.nivel_confianca_geral === 'Alta' ? 'Alta' : 
                                      data.analise_ia.nivel_confianca_geral === 'Média' ? 'Média' : 'Baixa';
                    html += `
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span class="confidence ${nivelClass}" style="font-size: 18px; padding: 10px 30px;">
                                Nível de Confiança Geral: ${data.analise_ia.nivel_confianca_geral}
                            </span>
                        </div>
                    `;
                }

                // === ESTATÍSTICAS BASE EXPANDIDAS ===
                html += `
                    <div class="stats-base">
                        <h4 style="color: #4CAF50; margin-bottom: 10px;">📊 Estatísticas Base</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <p><strong>Total de jogos:</strong> ${data.estatisticas_base.total_jogos}</p>
                                <p><strong>Média de gols:</strong> ${data.estatisticas_base.media_gols}</p>
                                <p><strong>Média últimos 5:</strong> ${data.estatisticas_base.media_ultimos_5}</p>
                                <p><strong>Média últimos 10:</strong> ${data.estatisticas_base.media_ultimos_10}</p>
                            </div>
                            <div>
                                <p><strong>Under 1.5:</strong> ${data.estatisticas_base.under_15}</p>
                                <p><strong>Under 2.5:</strong> ${data.estatisticas_base.under_25}</p>
                                <p><strong>Over 2.5:</strong> ${data.estatisticas_base.over_25}</p>
                                <p><strong>Over 3.5:</strong> ${data.estatisticas_base.over_35}</p>
                            </div>
                        </div>
                    </div>
                `;

                // === ÚLTIMOS JOGOS DE REFERÊNCIA ===
                if (data.ultimos_jogos_referencia && data.ultimos_jogos_referencia.length > 0) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">🎮 Últimos Jogos (Referência)</h3>
                        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px;">
                    `;
                    data.ultimos_jogos_referencia.forEach((jogo, idx) => {
                        const corTipo = jogo.tipo.includes('OVER') ? '#4CAF50' : '#2196F3';
                        html += `
                            <div style="background: #2a2a2a; padding: 10px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid ${corTipo};">
                                <strong>${jogo.jogo}</strong> - ${jogo.gols} gols
                                <span style="float: right; color: ${corTipo}; font-weight: bold;">${jogo.tipo}</span>
                            </div>
                        `;
                    });
                    html += `</div>`;
                }

                // === PADRÕES DETECTADOS ===
                if (data.padroes_detectados) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">🔍 Padrões Detectados</h3>
                        <div class="stats-base">
                    `;
                    
                    // Sequência atual
                    if (data.padroes_detectados.sequencia_atual) {
                        const seq = data.padroes_detectados.sequencia_atual;
                        html += `
                            <div style="margin-bottom: 15px;">
                                <p><strong>Sequência Atual:</strong> ${seq.tamanho} jogos ${seq.tipo.toUpperCase()}</p>
                                <p style="color: #888; font-size: 13px;">Gols: ${seq.historico_gols.join(', ')}</p>
                            </div>
                        `;
                    }
                    
                    // Compensação
                    if (data.padroes_detectados.compensacao) {
                        const comp = data.padroes_detectados.compensacao;
                        const corComp = comp.ativa ? '#FF5722' : '#4CAF50';
                        html += `
                            <div style="margin-bottom: 15px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${corComp};">
                                <p><strong>Compensação:</strong> ${comp.ativa ? '⚠️ ATIVA' : '✅ Inativa'}</p>
                                <p style="color: #888; font-size: 13px;">${comp.descricao}</p>
                                ${comp.jogos_apos_alto ? `<p style="color: #888; font-size: 13px;">Jogos após alto: ${comp.jogos_apos_alto}</p>` : ''}
                            </div>
                        `;
                    }
                    
                    // Desvio da média
                    if (data.padroes_detectados.desvio_media) {
                        const desvio = data.padroes_detectados.desvio_media;
                        html += `
                            <div style="margin-bottom: 15px;">
                                <p><strong>Desvio da Média:</strong> ${desvio.status.toUpperCase()} (${desvio.valor > 0 ? '+' : ''}${desvio.valor})</p>
                                <p style="color: #888; font-size: 13px;">${desvio.descricao}</p>
                            </div>
                        `;
                    }
                    
                    html += `</div>`;
                }

                // === ALERTAS ===
                if (data.analise_ia.alertas && data.analise_ia.alertas.length > 0) {
                    html += `
                        <h3 style="color: #FFC107; margin: 20px 0 10px 0;">⚠️ Alertas Importantes</h3>
                        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 3px solid #FFC107;">
                    `;
                    data.analise_ia.alertas.forEach((alerta, idx) => {
                        html += `<p style="margin-bottom: 10px;">🔸 ${alerta}</p>`;
                    });
                    html += `</div>`;
                }

                // === ANÁLISE DE CONTEXTO ===
                if (data.analise_ia.analise_contexto) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">📊 Análise de Contexto</h3>
                        <div class="analysis-text">${data.analise_ia.analise_contexto}</div>
                    `;
                }

                // === ESTRATÉGIA RECOMENDADA ===
                if (data.analise_ia.estrategia_recomendada) {
                    html += `
                        <h3 style="color: #667eea; margin: 20px 0 10px 0;">🎯 Estratégia Recomendada</h3>
                        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); 
                                    padding: 20px; border-radius: 8px; border-left: 3px solid #667eea;">
                            <p style="font-size: 16px; line-height: 1.6;">${data.analise_ia.estrategia_recomendada}</p>
                        </div>
                    `;
                }

                // === ANÁLISE DA TENDÊNCIA (FALLBACK) ===
                if (data.analise_ia.analise_tendencia) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">📊 Análise de Tendência</h3>
                        <div class="analysis-text">${data.analise_ia.analise_tendencia}</div>
                    `;
                }

                // === JOGO 1 (COM MAIS DETALHES) ===
                if (data.analise_ia.jogo_1) {
                    html += `
                        <h3 style="color: #4CAF50; margin: 20px 0 10px 0;">🎯 Jogo 1</h3>
                        <div class="prediction-card">
                            <div class="previsao-tipo">${data.analise_ia.jogo_1.previsao}</div>
                            <span class="confidence ${data.analise_ia.jogo_1.confianca}">Confiança: ${data.analise_ia.jogo_1.confianca}</span>
                            ${data.analise_ia.jogo_1.probabilidade ? `<p style="margin-top: 8px; color: #888;"><strong>Probabilidade:</strong> ${data.analise_ia.jogo_1.probabilidade}</p>` : ''}
                            ${data.analise_ia.jogo_1.gols_esperados ? `<p style="color: #888;"><strong>Gols Esperados:</strong> ${data.analise_ia.jogo_1.gols_esperados}</p>` : ''}
                            <p style="margin-top: 10px;">${data.analise_ia.jogo_1.justificativa}</p>
                        </div>
                    `;
                }

                // === CENÁRIO A ===
                if (data.analise_ia.cenario_a) {
                    html += `
                        <h3 style="color: #FFC107; margin: 30px 0 10px 0;">🔸 ${data.analise_ia.cenario_a.condicao}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="prediction-card" style="border-left-color: #FFC107;">
                                <h4>Jogo 2</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_a.jogo_2.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_a.jogo_2.confianca}">Confiança: ${data.analise_ia.cenario_a.jogo_2.confianca}</span>
                                ${data.analise_ia.cenario_a.jogo_2.probabilidade ? `<p style="margin-top: 8px; color: #888; font-size: 13px;"><strong>Probabilidade:</strong> ${data.analise_ia.cenario_a.jogo_2.probabilidade}</p>` : ''}
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_a.jogo_2.justificativa}</p>
                            </div>
                            <div class="prediction-card" style="border-left-color: #FFC107;">
                                <h4>Jogo 3</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_a.jogo_3.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_a.jogo_3.confianca}">Confiança: ${data.analise_ia.cenario_a.jogo_3.confianca}</span>
                                ${data.analise_ia.cenario_a.jogo_3.probabilidade ? `<p style="margin-top: 8px; color: #888; font-size: 13px;"><strong>Probabilidade:</strong> ${data.analise_ia.cenario_a.jogo_3.probabilidade}</p>` : ''}
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_a.jogo_3.justificativa}</p>
                            </div>
                        </div>
                    `;
                }

                // === CENÁRIO B ===
                if (data.analise_ia.cenario_b) {
                    html += `
                        <h3 style="color: #2196F3; margin: 30px 0 10px 0;">🔹 ${data.analise_ia.cenario_b.condicao}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="prediction-card" style="border-left-color: #2196F3;">
                                <h4>Jogo 2</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_b.jogo_2.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_b.jogo_2.confianca}">Confiança: ${data.analise_ia.cenario_b.jogo_2.confianca}</span>
                                ${data.analise_ia.cenario_b.jogo_2.probabilidade ? `<p style="margin-top: 8px; color: #888; font-size: 13px;"><strong>Probabilidade:</strong> ${data.analise_ia.cenario_b.jogo_2.probabilidade}</p>` : ''}
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_b.jogo_2.justificativa}</p>
                            </div>
                            <div class="prediction-card" style="border-left-color: #2196F3;">
                                <h4>Jogo 3</h4>
                                <div class="previsao-tipo" style="font-size: 20px;">${data.analise_ia.cenario_b.jogo_3.previsao}</div>
                                <span class="confidence ${data.analise_ia.cenario_b.jogo_3.confianca}">Confiança: ${data.analise_ia.cenario_b.jogo_3.confianca}</span>
                                ${data.analise_ia.cenario_b.jogo_3.probabilidade ? `<p style="margin-top: 8px; color: #888; font-size: 13px;"><strong>Probabilidade:</strong> ${data.analise_ia.cenario_b.jogo_3.probabilidade}</p>` : ''}
                                <p style="margin-top: 10px; font-size: 13px;">${data.analise_ia.cenario_b.jogo_3.justificativa}</p>
                            </div>
                        </div>
                    `;
                }
                
                // === FALLBACK PARA FORMATO ANTIGO ===
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

                // === AVISO SE HOUVER ===
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
        setInterval(carregarResultados, 60000);
