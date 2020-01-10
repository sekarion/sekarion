/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2020 Joris Dugué
 **/
document.addEventListener("DOMContentLoaded", function () {
    //load waves
    Waves.init();
    $(".nav-menu a").each(function () {
        let pageUrl = window.location.href.split(/[?#]/)[0];
        if (this.href === pageUrl) {
            $(this).parent().addClass("active"); // add active to li of the current link
            $(this).parent().parent().parent().addClass("active"); // add active class to an anchor
            $(this).parent().parent().parent().parent().parent().addClass("active"); // add active class to an anchor
        }
    });
    $(".navbar-toggle").on("click", function () {
        $(this).toggleClass("open");
        $("#navigation").slideToggle(400);
    });

    $(".nav-menu>li").slice(-1).addClass("last-elements");

    $(".nav-menu li.has-submenu a[href=\"#\"]").on("click", function (e) {
        if ($(window).width() < 992) {
            e.preventDefault();
            $(this).parent("li").toggleClass("open").find(".submenu:first").toggleClass("open");
        }
    });
    $("[data-toggle=\"tooltip\"]").tooltip();
    $("body").popover({
        selector: "[data-toggle=\"popover\"]",
        trigger: "hover",
        container: "body",
        animation: false
    }).on("hide.bs.popover", function () {
        if ($(".popover:hover").length) {
            return false;
        }
    });

    $("body").on("mouseleave", ".popover", function () {
        $(".popover").popover("hide");
    });
});

window.onload = flashAlert();

/**
 * Fonction pour multi element flash
 */

function flashAlert() {
    var allerts = document.querySelectorAll("#flash");

    for (var i = 0; i <= allerts.length; i++) {
        if (allerts[i]) {
            allerts[i].style.top = 140 + (50 * i) + "px";
        }
    }
}

/**
 * Fonction pour cacher chaque element flash aux bout de 5s
 */
function header() {
    var allerts = document.querySelectorAll("#flash");
    for (var i = 0; i <= allerts.length; i++) {
        if (allerts[i]) {
            allerts[i].classList.add("hidden");
        }
    }
}

if (document.querySelector("#flash")) {
    setTimeout(header, 5000);
}