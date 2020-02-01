const ctx = document.getElementById('myChart').getContext('2d');
const ctxe = document.getElementById('genero').getContext('2d');
const ctxa = document.getElementById('enfermedad').getContext('2d');

chartIt();
chartIt1();
chartIt2();

async function chartIt(){
const data = await getData();    
var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: data.xlabels,
        datasets: [{
            label: 'Género por médicos',
            data: data.ytemps,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)'
                 
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
            
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
})
}

async function getData(){
    var xlabels = [];
    var ytemps=[];
    
    const response = await fetch('GraficasMedico.csv');
    const data = await response.text();

    const table = data.split('\n').slice(1);
    table.forEach(row =>{
        const columns = row.split(',');
        const pac = columns[0];
        xlabels.push(pac);
        const temp = columns[1];
        ytemps.push(temp);
        console.log(pac,temp);
    });
    return{xlabels,ytemps};
}

//Genero pacientes    
async function chartIt1(){
    const data = await getData1();
var genero = new Chart(ctxe, {
    type: 'bar',
    data: {
        labels: data.xlabels,
        datasets: [{
            label: ['Género por paciente'],
            data: data.ytemps,
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)'
                 
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});
}

async function getData1(){
    var xlabels = [];
    var ytemps=[];
    
    const response = await fetch('GraficasPaciente.csv');
    const data = await response.text();

    const table = data.split('\n').slice(1);
    table.forEach(row =>{
        const columns = row.split(',');
        const pac = columns[0];
        xlabels.push(pac);
        const temp = columns[1];
        ytemps.push(temp);
        console.log(pac,temp);
    });
    return{xlabels,ytemps};
}


//Enfermedades    
async function chartIt2(){
    const data = await getData2();
const enfermedad = new Chart(ctxa, {
    type: 'doughnut',
    data: {
        labels: data.xlabels,
        datasets: [{
            label: 'enfermedad',
            data: data.ytemps,
            backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)','rgba(255, 206, 86, 0.2)'],
        }]
    },
    options: {
        title: {
          display: true,
          text: 'Enfermedades cardiovasculares'
        }
    }
});
}


async function getData2(){
    var xlabels = [];
    var ytemps=[];
    
    const response = await fetch('Enfermedades.csv');
    const data = await response.text();

    const table = data.split('\n').slice(1);
    table.forEach(row =>{
        const columns = row.split(',');
        const pac = columns[0];
        xlabels.push(pac);
        const temp = columns[1];
        ytemps.push(temp);
        console.log(pac,temp);
    });
    return{xlabels,ytemps};
}