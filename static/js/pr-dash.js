/**
 * Created by saksham.ghimire on 9/1/16.
 */
var hostURL = "http://localhost:5000"
var pullReqsURL = hostURL + "/pull-requests"
var blinkList = []
var pullReqsOnPage = []

// fire-up for page load, after that setInterval() will take care of the updates :)
getPullRequestData()

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

setInterval('getPullRequestData()', 1000 * 30);

function getPullRequestData() {
    console.log("updating data ...")
    $.ajax({
        url: pullReqsURL,
        type: 'GET',
        contentType: 'application/json',
        success: function (result) {
            buildHTML(result)
        },
        error: function (error) {
            console.log(error)
        }
    })
}

function getPullRequestCommits(projectName, repoName, prID, callback) {
    var urlArgs = {
        projectName: projectName,
        repoName: repoName,
        prID: prID
    }
    $.ajax({
        url: pullReqsURL + "/commits",
        type: 'GET',
        data: urlArgs,
        contentType: 'application/json',
        success: function (result) {
            callback(JSON.parse(result).size)
        },
        error: function (error) {
            console.log(error)
        }
    })
}
function buildHTML(data) {
    var totalPullReqs = 0;
    var htmlString = "";
    var tileCount = 0;
    pullReqsOnPage = [];
    for (var pItem = 0; pItem < data.length; pItem++) {

        var jsonData = JSON.parse(data[pItem])
        totalPullReqs += (jsonData.size)

        for (var item = 0; item < jsonData.size; item++) {

            getPullRequestCommitDetails(jsonData.values[item].toRef.repository.project.key,
                jsonData.values[item].toRef.repository.slug, jsonData.values[item].id, tileCount)

            htmlString += "<div class='green-header'>" + jsonData.values[item].title + "</div>"
            htmlString += "<div class='green' ondblclick='flashAndMessage(this)' onclick='unblink(this)' id='tile" + tileCount + "'>"
            htmlString += "<img class='profile-photo' src='http://stash-stg01.sats.corp:7990/users/" + jsonData.values[item].author.user.name + "/avatar.png' alt='alternative text' title='" + jsonData.values[item].author.user.name + "'/>"
            htmlString += getFormattedHTMLBoxWithURL(jsonData.values[item].links.self[0].href, jsonData.values[item].toRef.repository.slug, "pill-green")
            htmlString += "<span class='badge' id='commit-" + tileCount + "'>00</span>"
            htmlString += getFormattedHTMLBoxWithURL(jsonData.values[item].links.self[0].href, (jsonData.values[item].fromRef.displayId + "<span class='glyphicon glyphicon-arrow-right'></span>" + jsonData.values[item].toRef.displayId), "pill-blue")
            htmlString += getPhotoStripHTML(jsonData.values[item].reviewers)
            htmlString += "</div>"

            pullReqsOnPage.push(jsonData.values[item].links.self[0].href)
            tileCount++
        }
        setDivContent('pull-requests-view', htmlString);

    }
    $('#total-pull-requests').html(totalPullReqs);

    for (var t = 0; t < blinkList.length; t++) {
        if ((pullReqsOnPage.indexOf($(blinkList[t]).find('.hypLink').attr('href'))) > -1) {
            flash($(blinkList[t]).find('.hypLink').attr('href'))
        }
    }
}

function unblink(selector) {
    $(selector).stop()
    $(selector).fadeIn({opacity: 1})
}

function blink(selector) {
    $(selector).fadeOut('slow', function () {
        $(this).fadeIn('slow', function () {
            blink(this);
        });
    });
}

function flash(selector) {
    blink($("a[href='" + selector + "']").parent().parent())
}

function flashAndMessage(selector) {
    var pullReqURL = $(selector).find('.hypLink').attr('href')
    blinkList.push(selector)
    sendToHipChat(pullReqURL)
    blink(selector)
}

function sendToHipChat(pullReqURL) {
    var urlArgs = {
        pullReqURL: pullReqURL
    }
    $.ajax({
        url: hostURL + "/hipchat",
        type: 'GET',
        data: urlArgs,
        contentType: 'application/json',
        success: function (result) {
        },
        error: function (error) {
            console.log(error)
        }
    })
}
function getPhotoStripHTML(data) {
    var htmlPhotoString = "<div class='pull-right'>";
    for (var photoItem = 0; photoItem < (data).length; photoItem++) {
        if (data[photoItem].approved != true) {
            htmlPhotoString += "<img class='profile-photo-unapproved' src='http://stash-stg01.sats.corp:7990/users/" +
                data[photoItem].user.slug + "/avatar.png' alt='alternative text' title='" + data[photoItem].user.slug + "' />"
        } else {
            htmlPhotoString += "<img class='profile-photo-approved' src='http://stash-stg01.sats.corp:7990/users/" +
                data[photoItem].user.slug + "/avatar.png' alt='alternative text' title='" + data[photoItem].user.slug + "' />"
        }
    }
    htmlPhotoString += "</div>"
    return htmlPhotoString
}

function getFormattedHTMLBoxWithURL(url, text, cssClassName) {
    return "<div class='" + cssClassName + "'><a class='hypLink' href='" + url + "'target='_blank'>" + text + "</a></div>"
}

function getPullRequestCommitDetails(projectName, repoName, prID, tileCount) {
    getPullRequestCommits(projectName, repoName, prID, function (result) {
        $('#commit-' + tileCount).html(result)
    })
}

function getFormattedHTMLBox(text, cssClassName) {
    return "<div class='" + cssClassName + "'>" + text + "</a></div>"
}

function setDivContent(divID, divContent) {
    document.getElementById(divID).innerHTML = divContent
}

function appendDivContent(divID, divContent) {
    $("#" + divID).append(divContent);
}
