const acoes = require("./carteiraCaio.json");
const axios = require("axios").default;

const rank = {};
const ASC = "asc";
const DESC = "desc";

// Função principal para executar todas as atividades assíncronas
async function main() {
    const promises = acoes.map(async (item) => {
        const INDICADORES_ASC = ["p_l", "p_vp", "dividaliquidaebit", "peg_ratio"];
        const INDICADORES_DESC = ["roe", "roic", "margemliquida", "lucros_cagr5", "dy"];
        
        await fillRank(INDICADORES_ASC, ASC, item);
        await fillRank(INDICADORES_DESC, DESC, item);
    });

    await Promise.all(promises);
    fillNotaFinalEmpresa();
    ordenarRank();
    console.log(rank);
}

async function fillRank(indicadores, tipoOrdenacao, item) {
    const listaAcoes = await getListaAcoes(item);
    fillNotasEmpresas(indicadores, tipoOrdenacao, listaAcoes, item.codigoAcao);
}

function fillNotasEmpresas(indicadores, tipoOrdenacao, listaAcoesSegmento, acao) {
    var sortedData = null;
    indicadores.forEach((indicador) => {
        sortedData = fillSortedData(tipoOrdenacao, sortedData, listaAcoesSegmento, indicador);

        var posicao = sortedData.findIndex((element) => element["ticker"] === acao);
        var nota = getNotaEmpresa(posicao + 1, sortedData.length);
        console.log(posicao, nota);

        if (!rank[acao]) {
            rank[acao] = {};
        }
        rank[acao][indicador] = nota;
    });
}

function getNotaEmpresa(posicao, qtdEmpresas) {
    return parseFloat(((10 * posicao) / qtdEmpresas).toFixed(1));
}

function fillSortedData(tipoOrdenacao, sortedData, listaAcoesSegmento, indicador) {
    if (tipoOrdenacao === ASC) {
        sortedData = listaAcoesSegmento.sort((a, b) => a[indicador] - b[indicador]);
    } else {
        sortedData = listaAcoesSegmento.sort((a, b) => b[indicador] - a[indicador]);
    }
    return sortedData;
}

async function getListaAcoes(item) {
    console.log(`Ações ${item.codigoAcao}`);

    const search = `{"Sector":${item.sector},"SubSector":${item.subSector},"Segment":${item.segment}}`;
    var options = {
        method: 'GET',
        url: 'https://statusinvest.com.br/category/advancedsearchresultpaginated',
        params: {
            search: search,
            isAsc: 'false',
            page: '0',
            CategoryType: '1',
            take: '9999'
        },
        headers: {
            "User-Agent": 'insomnia/9.2.0'
        }
    };

    const response = await axios.request(options);
    const listaAcoes = response.data.list;
    return listaAcoes;
}

function fillNotaFinalEmpresa() {
    for(const acao in rank){
        const indicadores = rank[acao];
        const notas = Object.values(indicadores);
        const somaNotas = notas.reduce((acc, nota) => acc + nota, 0);
        const notaFinal = parseFloat((somaNotas / notas.length).toFixed(1));
        rank[acao].notaFinal = notaFinal;
    }
}

function ordenarRank() {
    const rankEntries = Object.entries(rank);
    const sortedRankEntries = rankEntries.sort(([acaoA], [acaoB]) => acaoA.localeCompare(acaoB));
    const sortedRank = Object.fromEntries(sortedRankEntries);
    console.log(sortedRank);
}

// Executar a função principal
main();
