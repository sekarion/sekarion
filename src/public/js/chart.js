/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2020 Joris Dugué
 **/
document.addEventListener("DOMContentLoaded", function () {
    $(".days").on("click", function (evt) {
        axios({
            method: "GET",
            url: `/days/${evt.target.dataset.id}`,
        }).then(function (response) {
            window[`chart${evt.target.dataset.number}`].updateOptions({
                series: [{
                    name: "Ping",
                    data: response.data.metric.data
                }],
                xaxis: {
                    type: "datetime",
                    min: response.data.time,
                },
            });
            document.getElementById(`average${evt.target.dataset.id}`).innerHTML = response.data.summary.average.toFixed(0) + " ms";
        });
        document.querySelector(`.days${evt.target.dataset.id}`).classList.add("active");
        document.querySelector(`.hours${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.weeks${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.months${evt.target.dataset.id}`).classList.remove("active");
    });
    $(".hours").on("click", function (evt) {
        axios({
            method: "GET",
            url: `/hours/${evt.target.dataset.id}`,
        }).then(function (response) {
            window["chart"+evt.target.dataset.number].updateOptions({
                series: [{
                    name: "Ping",
                    data: response.data.metric.data
                }],
                xaxis: {
                    type: "datetime",
                    min: response.data.time,
                },
            });
            document.getElementById(`average${evt.target.dataset.id}`).innerHTML = response.data.summary.average.toFixed(0) + " ms";
        });
        document.querySelector(`.hours${evt.target.dataset.id}`).classList.add("active");
        document.querySelector(`.days${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.weeks${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.months${evt.target.dataset.id}`).classList.remove("active");
    });
    $(".months").on("click", function (evt) {
        axios({
            method: "GET",
            url: `/months/${evt.target.dataset.id}`,
        }).then(function (response) {
            window["chart"+evt.target.dataset.number].updateOptions({
                series: [{
                    name: "Ping",
                    data: response.data.metric.data
                }],
                xaxis: {
                    type: "datetime",
                    min: response.data.time,
                },
            });
            document.getElementById(`average${evt.target.dataset.id}`).innerHTML = response.data.summary.average.toFixed(0) + " ms";
        });
        document.querySelector(`.months${evt.target.dataset.id}`).classList.add("active");
        document.querySelector(`.hours${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.weeks${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.days${evt.target.dataset.id}`).classList.remove("active");
    });
    $(".weeks").on("click", function (evt) {
        axios({
            method: "GET",
            url: `/weeks/${evt.target.dataset.id}`,
        }).then(function (response) {
            window["chart"+evt.target.dataset.number].updateOptions({
                series: [{
                    name: "Ping",
                    data: response.data.metric.data
                }],
                xaxis: {
                    type: "datetime",
                    min: response.data.time,
                },
            });
            document.getElementById(`average${evt.target.dataset.id}`).innerHTML = response.data.summary.average.toFixed(0) + " ms";
        });
        document.querySelector(`.weeks${evt.target.dataset.id}`).classList.add("active");
        document.querySelector(`.hours${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.days${evt.target.dataset.id}`).classList.remove("active");
        document.querySelector(`.months${evt.target.dataset.id}`).classList.remove("active");
    });
});