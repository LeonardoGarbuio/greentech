import db from '../db.js';

// Get Gemini Key from Environment or use demo fallback
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const aiService = {
    /**
     * Analisa uma foto enviada (Base64) usando o Gemini Vision para classificar resíduos e detectar fraude.
     */
    analyzeImage: async (base64Image, actorRole = 'producer') => {
        try {
            if (!GEMINI_API_KEY) {
                console.log("[AI SERVICE] Chave GEMINI_API_KEY não configurada. Usando Fallback de Alta Fidelidade.");
                return addAnalysisMetadata(generateMockImageAnalysis(base64Image), 'demo');
            }

            console.log("[AI SERVICE] Enviando imagem ao Gemini 2.0 Flash...");
            
            // Prepare image data for Gemini API format
            // Base64 header cleanup (e.g. data:image/png;base64,xxxx -> xxxx)
            const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

            const prompt = `Você é o analista de visão computacional da Greentech, sistema de reciclagem segura e sustentável.
            Analise a imagem fornecida sob dois aspectos rigorosos:
            
            1. FRAUDE / SEGURANÇA:
               - Verifique se a foto é "fake", isto é, se é uma foto tirada de uma tela de computador, print de internet com marca d'água, foto de outra foto impressa, ou se a imagem não contém materiais recicláveis reais (ex: foto de uma parede, um animal, ou paisagem sem lixo).
               - Defina "isFake" como true se for fraude. Descreva o motivo em "fraudReason".
            
            2. DETECÇÃO DE RESÍDUOS:
               - Se NÃO for fraude, identifique quais e quantos resíduos recicláveis estão na foto.
               - Classifique-os estritamente entre: "plastic" (Plástico), "aluminum" (Alumínio/Metais), "paper" (Papelão/Papel) e "glass" (Vidro).
               - Estime o peso aproximado em KG ("weightKg") de cada grupo de material.
               - Estime o valor monetário que o catador receberá baseado nestes valores de referência: Alumínio R$ 5.00/kg, Plástico R$ 1.50/kg, Papelão R$ 0.80/kg, Vidro R$ 0.20/kg.
               - Calcule as moedas virtuais GreenCoins (10 GC por kg).
            
            Você deve responder ESTRITAMENTE em formato JSON válido e nada mais, sem blocos markdown de código (\`\`\`json). Use este esquema exato:
            {
              "isFake": false,
              "fraudReason": "",
              "materials": [
                { "type": "plastic", "label": "Garrafas PET", "quantity": "3 garrafas transparentes", "weightKg": 0.15 }
              ],
              "totalWeightKg": 0.15,
              "estimatedEarnings": 0.23,
              "greenCoins": 2
            }`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: 'image/jpeg',
                                        data: cleanBase64
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            responseMimeType: 'application/json'
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Gemini API returned status ${response.status}`);
            }

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("[AI SERVICE] Gemini Response:", textResponse);

            return addAnalysisMetadata(JSON.parse(textResponse.trim()), 'live');
        } catch (err) {
            console.error("[AI SERVICE] Erro ao chamar Gemini Vision API:", err.message);
            console.log("[AI SERVICE] Usando Fallback de Imagem...");
            return addAnalysisMetadata(generateMockImageAnalysis(base64Image), 'demo');
        }
    },

    /**
     * Otimiza a rota de coletas do catador
     */
    optimizeRoute: async (collectorId, currentCoords, activePoints = []) => {
        try {
            if (activePoints.length === 0) {
                return {
                    optimizedRoute: [],
                    totalDistanceEstimation: "0 km",
                    fuelSavedPercentage: 0,
                    reasoning: "Sem coletas ativas selecionadas para otimizar rota.",
                    optimizationMode: 'heuristic',
                    optimizationProvider: 'Heurística geográfica local'
                };
            }

            if (!GEMINI_API_KEY) {
                console.log("[AI SERVICE] Chave GEMINI_API_KEY ausente. Usando heurística geográfica local.");
                return generateHeuristicRouteOptimization(currentCoords, activePoints);
            }

            console.log(`[AI SERVICE] Chamando Gemini para otimizar rota com ${activePoints.length} pontos...`);
            
            const prompt = `Você é o copiloto de rotas ecológicas inteligentes da Greentech. 
            O coletor está na localização atual (Lat: ${currentCoords.lat}, Lng: ${currentCoords.lng}) e deseja coletar os seguintes pontos de descarte ativos (IDs e coordenadas):
            ${JSON.stringify(activePoints.map(p => ({ id: p.id, lat: p.lat, lng: p.lng, type: p.type, weight: p.weight_kg })))}
            
            Ordene as paradas (IDs dos pontos) na sequência física mais lógica, rápida e econômica em combustível para o coletor.
            Evite trajetos em zigue-zague. Ordene apenas os pontos enviados; o aplicativo acrescentará como destino a organização de reciclagem mais próxima encontrada na cidade do usuário. Calcule uma estimativa de distância total e porcentagem estimada de combustível economizado graças a essa organização de trajeto.
            
            Forneça a resposta estritamente em formato JSON válido usando esta estrutura:
            {
              "optimizedRoute": [lista ordenada de IDs de pontos],
              "totalDistanceEstimation": "5.2 km",
              "fuelSavedPercentage": 25,
              "reasoning": "Breve justificativa motivadora em português explicando o motivo da ordem (ex: agrupar coletas próximas primeiro, trajeto reto até o descarte)."
            }`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json' }
                    })
                }
            );

            if (!response.ok) throw new Error(`Gemini API status ${response.status}`);

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
            return {
                ...JSON.parse(textResponse.trim()),
                optimizationMode: 'live',
                optimizationProvider: 'Google Gemini'
            };
        } catch (err) {
            console.error("[AI SERVICE] Erro ao otimizar rota:", err.message);
            return generateHeuristicRouteOptimization(currentCoords, activePoints);
        }
    },

    /**
     * Gera uma previsão financeira e metas de crescimento mensais baseada no histórico do catador
     */
    getFinancialForecast: async (collectorId) => {
        let earnings = 0;
        let collectionsCount = 0;
        try {
            // Buscar dados reais do catador no banco
            const collector = await db.get("SELECT earnings, collections_count FROM collectors WHERE id = ?", [collectorId]);
            earnings = collector ? collector.earnings : 350.00;
            collectionsCount = collector ? collector.collections_count : 12;

            if (!GEMINI_API_KEY) {
                return generateMockForecast(earnings, collectionsCount);
            }

            console.log(`[AI SERVICE] Gerando previsão financeira para Coletor ${collectorId}...`);

            const prompt = `Você é o planejador financeiro e coach de produtividade dos catadores de recicláveis da Greentech.
            Analise estes dados do mês atual de um coletor de materiais recicláveis no Brasil:
            - Faturamento acumulado: R$ ${earnings.toFixed(2)}
            - Total de coletas realizadas: ${collectionsCount}
            
            Determine:
            1. Uma previsão realista de ganho para o próximo mês ("nextMonthForecast") se ele mantiver a frequência.
            2. Potencial de crescimento percentual máximo ("growthPotentialPercentage") se ele aplicar técnicas de otimização de rotas e focar em materiais de alto valor (como latas de alumínio e PET limpo).
            3. Três dicas práticas e objetivas, apropriadas à realidade brasileira, sobre como organizar melhor o trabalho e aumentar os ganhos sem inventar preços locais.
            4. Uma mensagem curta, humana e muito motivadora para animar o trabalho dele.
            
            Responda estritamente em JSON válido com as chaves:
            {
              "nextMonthForecast": 480.00,
              "growthPotentialPercentage": 35,
              "tips": ["dica 1", "dica 2", "dica 3"],
              "motivationalMessage": "string de incentivo"
            }`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json' }
                    })
                }
            );

            if (!response.ok) throw new Error(`Gemini API status ${response.status}`);

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
            return JSON.parse(textResponse.trim());
        } catch (err) {
            console.error("[AI SERVICE] Erro ao obter previsão financeira:", err.message);
            return generateMockForecast(earnings, collectionsCount);
        }
    }
};

// --- MOCK FALLBACK GENERATORS (Demo Safe & Offline Proof) ---

function addAnalysisMetadata(analysis, mode) {
    const isLive = mode === 'live';
    return {
        ...analysis,
        analysisMode: mode,
        analysisProvider: isLive ? 'Google Gemini' : 'Simulação local',
        requiresHumanConfirmation: true,
        disclaimer: isLive
            ? 'Triagem assistida por IA. Confirme o material e o peso antes de publicar.'
            : 'Modo demonstração: resultado simulado, sem análise real da imagem. Confirme e corrija os dados manualmente.'
    };
}

function generateMockImageAnalysis(base64Image) {
    // Apenas simular baseado se a imagem é muito curta ou representativa
    // Em apresentações de feira, fotos reais de latinhas darão sucesso
    const isShortImage = base64Image.length < 500; 
    
    if (isShortImage) {
        return {
            isFake: true,
            fraudReason: "Foto suspeita ou arquivo corrompido. Certifique-se de fotografar o resíduo real na sua frente.",
            materials: [],
            totalWeightKg: 0,
            estimatedEarnings: 0,
            greenCoins: 0
        };
    }

    // Gerar uma lista de resíduos realistas e randômicos de alta qualidade para o MVP
    const rand = Math.random();
    if (rand < 0.35) {
        return {
            isFake: false,
            fraudReason: "",
            materials: [
                { type: "plastic", label: "Garrafas PET", quantity: "4 garrafas plásticas", weightKg: 0.20 },
                { type: "aluminum", label: "Latinhas de Alumínio", quantity: "8 latas de refrigerante", weightKg: 0.12 }
            ],
            totalWeightKg: 0.32,
            estimatedEarnings: 0.90, // 0.2 * 1.5 + 0.12 * 5.0
            greenCoins: 3
        };
    } else if (rand < 0.7) {
        return {
            isFake: false,
            fraudReason: "",
            materials: [
                { type: "paper", label: "Caixas de Papelão", quantity: "3 caixas grandes desmontadas", weightKg: 4.5 }
            ],
            totalWeightKg: 4.5,
            estimatedEarnings: 3.60, // 4.5 * 0.8
            greenCoins: 45
        };
    } else {
        return {
            isFake: false,
            fraudReason: "",
            materials: [
                { type: "glass", label: "Garrafas de Vidro", quantity: "2 garrafas de vidro vazias", weightKg: 1.0 },
                { type: "aluminum", label: "Latas de Alumínio", quantity: "5 latas", weightKg: 0.08 }
            ],
            totalWeightKg: 1.08,
            estimatedEarnings: 0.60, // 1 * 0.2 + 0.08 * 5
            greenCoins: 11
        };
    }
}

function generateHeuristicRouteOptimization(currentCoords, activePoints) {
    // Heurística do vizinho mais próximo: cada nova parada parte da anterior.
    const remaining = [...activePoints];
    const sorted = [];
    let current = currentCoords;
    while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;
        remaining.forEach((point, index) => {
            const distance = Math.pow(point.lat - current.lat, 2) + Math.pow(point.lng - current.lng, 2);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });
        const [nearest] = remaining.splice(nearestIndex, 1);
        sorted.push(nearest);
        current = { lat: nearest.lat, lng: nearest.lng };
    }

    const ids = sorted.map(p => p.id);

    return {
        optimizedRoute: ids,
        totalDistanceEstimation: null,
        fuelSavedPercentage: null,
        reasoning: "Ordem calculada por proximidade geográfica entre as paradas. Distância viária e economia de combustível não foram estimadas.",
        optimizationMode: 'heuristic',
        optimizationProvider: 'Heurística geográfica local'
    };
}

function generateMockForecast(earnings, collectionsCount) {
    const projected = earnings * 1.25;
    return {
        nextMonthForecast: parseFloat(projected.toFixed(2)),
        growthPotentialPercentage: 35,
        tips: [
            "Separe e mantenha secos os materiais de maior valor; confirme os preços praticados diretamente com a organização de destino.",
            "Agrupe coletas do mesmo bairro para reduzir deslocamentos, tempo e combustível.",
            "Confirme com a associação de destino quais materiais são recebidos e os valores praticados antes de iniciar a rota."
        ],
        motivationalMessage: "Seu trabalho sustenta o planeta e alimenta a economia circular. Utilizando as rotas inteligentes, estimamos que você possa bater sua meta mensal em apenas 18 dias de trabalho. Continue firme!"
    };
}

export default aiService;
