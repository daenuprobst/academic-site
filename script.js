const orcid = '0000-0003-1737-4407';
const orcidRoot = 'https://pub.orcid.org/v3.0';
const axiosOptions = {
    'headers': { 'Accept': 'application/json' }
}
const Cite = require('citation-js')

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

async function orcidLoadWorks(id) {
    let response = await axios.get(
        orcidRoot + '/' + id + '/works', axiosOptions)

    let urls = response.data.group.map(work => orcidRoot + work['work-summary'][0].path);

    let works = await axios.all(urls.map((url) => axios.get(url, axiosOptions)))
    return works.map(response => response.data.citation['citation-value']);
}

function renderPublications(publications) {
    let container = document.getElementById('publication-container');
    container.innerHTML = '';

    Object.keys(publications).sort((a, b) => b - a).forEach(year => {
        container.appendChild(htmlToElement('<h4>' + year + '</h4>'));
        publications[year].forEach(work => {
            container.appendChild(htmlToElement(work));
        });
    });
}

orcidLoadWorks(orcid).then(bibtexWorks => {
    const works = bibtexWorks.map(bw => Cite(bw));

    works.sort((a, b) => {
        const dateA = a.data[0].issued['date-parts'][0].join('-');
        const dateB = b.data[0].issued['date-parts'][0].join('-');
        return (dateA > dateB) ? -1 : ((dateA < dateB) ? 1 : 0);
    })

    // Group works by year
    let worksByYear = {}
    works.forEach(work => {
        const year = work.data[0].issued['date-parts'][0][0];

        if (!(year in worksByYear)) {
            worksByYear[year] = [];
        }

        worksByYear[year].push(work.format('bibliography', {
            format: 'html',
            template: 'apa',
            lang: 'en-US'
        }));
    });

    renderPublications(worksByYear);
})