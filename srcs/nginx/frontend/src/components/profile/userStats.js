export default function UserStatsComponent() {
    const userStatsSection = document.querySelector('#userStats');
    userStatsSection.innerHTML = `
        <h5 class="text-light">MAIN STATISTICS</h5>
        <div class="row">
            <div class="col-md-6 col-lg-3 col-sm-6">
                <div class="card game-card mb-3">
                    <div class="card-body text-light">
                        <h6 class="card-title text-center">x</h6>
                        <h6 class="card-text text-center">MATCHES</h6>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 col-sm-6">
                <div class="card game-card mb-3">
                    <div class="card-body text-light">
                        <h6 class="card-title text-center">x%</h6>
                        <h6 class="card-text text-center">WINRATE</h6>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 col-sm-6">
                <div class="card game-card mb-3">
                    <div class="card-body text-light">
                        <h6 class="card-title text-center">x</h6>
                        <h6 class="card-text text-center">LONGEST WINSTREAK</h6>
                    </div>
                </div>
            </div>
            <div class="col-md-6 col-lg-3 col-sm-6">
                <div class="card game-card mb-3">
                    <div class="card-body text-light">
                        <h6 class="card-title text-center">x</h6>
                        <h6 class="card-text text-center">RATIO</h6>
                    </div>
                </div>
            </div>
        </div>

        <h5 class="text-light">PERFORMANCE STATISTICS</h5>
        <div class="row">
            <div class="col-xl-6">
                <div class="btn-group-vertical w-100" role="group" aria-label="Basic radio toggle button group">
                    <input type="radio" class="btn-check" name="btnradio" id="radioRatioChart" autocomplete="off" checked>
                    <label class="btn btn-outline-primary" for="radioRatioChart">Ratio</label>

                    <input type="radio" class="btn-check" name="btnradio" id="radioTimesHitChart" autocomplete="off">
                    <label class="btn btn-outline-primary" for="radioTimesHitChart">Times Hit</label>
                </div>
            </div>
            <div class="col-xl-6">
                <div class="row">
                    <canvas id="statsChart"></canvas>
                </div>
                <div class="row mt-3">
                    <div class="col d-flex justify-content-between">
                        <button class="btn btn-primary" id="chartLeft">
                            <i class="bi bi-arrow-left-short"></i>
                        </button>
                        <button class="btn btn-primary" id="chartRight" disabled>
                            <i class="bi bi-arrow-right-short"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const radioRatioChart = document.getElementById('radioRatioChart');
    const radioTimesHitChart = document.getElementById('radioTimesHitChart');
    const chartLeftButton = document.getElementById('chartLeft');
    const chartRightButton = document.getElementById('chartRight');
    const statsChart = document.getElementById('statsChart');
    
    //===----------------------------------------------------------------------===//
    //                       Placeholder Data
    //===----------------------------------------------------------------------===//
    let matchStats = {
        matchId: 1,
        timeHit: 50,
        ratio: 5.0
    };
    
    let matchHistory = [];
    for (let i = 0; i < 10; ++i) {
        matchHistory.push({ ...matchStats });
        matchStats.matchId += 1;
        matchStats.timeHit = Math.floor(Math.random() * 100);
        matchStats.ratio = Math.random() * 3;
    }
    
    //===----------------------------------------------------------------------===//
    //                       Helper Functions
    //===----------------------------------------------------------------------===//
    function getLabel() {
        const range = [];
        for (let i = left; i <= right; ++i) {
            range.push(i + 1);
        }
        return range;
    }
    
    function getLast5Matches() {
        return matchHistory.slice(left, right + 1);
    }
    
    function moveRangeToRight() {
        left += matchesPerChart;
        right += matchesPerChart;
        if (matchHistory.length <= right + 1) {
            chartRightButton.disabled = true;
        }
        chartLeftButton.disabled = false;
    }
    
    function moveRangeToLeft() {
        left -= matchesPerChart;
        right -= matchesPerChart;
        if (left == 0) {
            chartLeftButton.disabled = true;
        }
        chartRightButton.disabled = false;
    }
    
    function getStatsFromCheckedRadio() {
        if (radioRatioChart.checked) {
            return getLast5Matches().map(match => match.ratio);
        } else if (radioTimesHitChart.checked) {
            return getLast5Matches().map(match => match.timeHit);
        }
        return []
    }
    //===----------------------------------------------------------------------===//
    
    const matchesPerChart = 5;
    let right;
    let left;

    if (matchHistory.length <= matchesPerChart) {
        chartLeftButton.disabled = true;
    }

    if ((matchHistory.length % matchesPerChart) != 0) {
        left = matchHistory.length - (matchHistory.length % matchesPerChart);
        right = left + matchesPerChart - 1;
    } else {
        right = matchHistory.length - 1;
        left = matchHistory.length - matchesPerChart;
    }
    
    let label = getLabel();
    let last5Matches = getLast5Matches();
    let data = last5Matches.map(match => match.ratio);
    
    let activeChart = new Chart(statsChart, {
        type: 'line',
        data: {
            labels: label,
            datasets: [{
                label: 'Ratio',
                data: data,
                borderColor: '#36A2EB',
                backgroundColor: '#00000',
                borderWidth: 3
            }]
        },
        options: {
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                }
            },
            plugins: {
                legend: {
                  display: false
                }
            }
        }
    });
    
    chartLeftButton.addEventListener('click', () => {
        moveRangeToLeft();
        activeChart.data.labels = getLabel();
        activeChart.data.datasets[0].data = getStatsFromCheckedRadio();
        activeChart.update();
    });
    
    chartRightButton.addEventListener('click', () => {
        moveRangeToRight();
        activeChart.data.labels = getLabel();
        activeChart.data.datasets[0].data = getStatsFromCheckedRadio();
        activeChart.update();
    });
    
    radioRatioChart.addEventListener('change', () => {
        activeChart.data.datasets[0].data = getLast5Matches().map(match => match.ratio);
        activeChart.data.datasets[0].label = "Ratio";
        activeChart.update();
    });

    radioTimesHitChart.addEventListener('change', () => {
        activeChart.data.datasets[0].data = getLast5Matches().map(match => match.timeHit);
        activeChart.data.datasets[0].label = "Times Hit";
        activeChart.update();
    });
}