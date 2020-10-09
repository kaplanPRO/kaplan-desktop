function fireOnReady () {
    $("button#btn-segment-merge").click(function () {
        $.post(
            "http://127.0.0.1:8000/project/" + $(files_view).attr("cur-p-id") + "/file/" + $(editor_view).attr("cur-f-id"),
            {
                segment_list: selectedSegments.join(';'),
                task: "merge_segments"
            }
        ).done(function() {
            selectedSegments = [];
            $("button#btn-segment-merge").prop("disabled", true).fadeOut(400);
            window.fetchSegments($(files_view).attr("cur-p-id"), $(editor_view).attr("cur-f-id"));
        })
    });
}

let selectedSegments = [];

function submitSegment(target_cell, segment_state) {
    paragraph_no = target_cell.closest("tr").attr("p-id");
    segment_no = target_cell.closest("tr").attr("id");
    source_segment = "<source>" + target_cell.closest("tr").find("td.source").html().replace(/<ph>\\n<\/ph>/g, "\n") + "</source>";
    target_segment = target_cell.html().replace(/&nbsp;/g, " ").replace(/<ph contenteditable="false">\\n<\/ph>/g, "\n");

    if (target_segment == "") {
        segment_state = "blank";
        target_segment = "<target/>"
    } else {
      target_segment = "<target>" + target_segment + "</target>";
    }

    if (segment_state == "draft" && !target_cell.closest("tr").hasClass("draft")) {
        return false;
    }

    $.post(
        "http://127.0.0.1:8000/project/" + $(filesView).attr("cur-p-id") + "/file/" + $(editorView).attr("cur-f-id"),
        {
            segment_state: segment_state,
            source_segment: source_segment,
            target_segment: target_segment,
            paragraph_no: paragraph_no,
            segment_no: segment_no,
            author_id: "local",
        }
        )
        .done(function(data) {
            console.log("Segment #" + segment_no + " submitted succesfully!");
            target_cell.closest("tr").removeAttr("class").addClass(segment_state);

            if (segment_state == "translated") {
                target_cell.closest("tr").next().find("td.target").focus();
            }
        })
        .fail(function(data) {
            console.log(data);
    })
}
function lookupSegment(sourceSegment, hitsTable) {
    let fileURL = "http://127.0.0.1:8000/project/"
                  + filesView.getAttribute("cur-p-id")
                  + "/file/"
                  + editorView.getAttribute("cur-f-id")
                  + "?task=lookup"
                  + "&source_segment="
                  + encodeURIComponent("<source>" + sourceSegment.innerHTML + "</source>");

    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            translationUnits = JSON.parse(this.responseText);
            hitsTable.innerHTML = "";
            [...Object.keys(translationUnits)].forEach(function(i) {
                translationUnit = document.createElement("unit");
                translationUnit.innerHTML = translationUnits[i].source;
                translationUnit.innerHTML += translationUnits[i].target;

                tr = document.createElement("tr");

                th = document.createElement("th");
                th.textContent = translationUnits[i].ratio + "%";
                tr.appendChild(th);

                td = document.createElement("td");
                td.innerHTML = translationUnit.getElementsByTagName("source")[0].innerHTML
                               .replace(/\\n/g, "<kaplan:placeholder>")
                               .replace(/\n/g, "<ph>\\n</ph>")
                               .replace(/<kaplan:placeholder>/g, "\\n");
                tr.appendChild(td);

                td = document.createElement("td");
                td.innerHTML = translationUnit.getElementsByTagName("target")[0].innerHTML
                               .replace(/\\n/g, "<kaplan:placeholder>")
                               .replace(/\n/g, "<ph>\\n</ph>")
                               .replace(/<kaplan:placeholder>/g, "\\n");
                tr.appendChild(td);

                ["sc", "ec", "ph", "g"].forEach(function(tagName) {
                    [...tr.getElementsByTagName(tagName)].forEach(function(tag) {
                        tag.contentEditable = "false";
                    })
                })


                hitsTable.append(tr);
            })
        }
    }

    xhttp.open("GET", fileURL);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
    xhttp.send();
}
function segmentSelect(segmentRow) {
    mergeButton = $("button#btn-segment-merge");
    segmentNo = segmentRow.find("th").text();

    if (selectedSegments.includes(segmentNo)) {
        selectedSegments = [].concat(selectedSegments.slice(0, selectedSegments.indexOf(segmentNo)), selectedSegments.slice(selectedSegments.indexOf(segmentNo) + 1))
        segmentRow.removeClass("selected");
    }
    else {
        selectedSegments.push(segmentNo);
        segmentRow.addClass("selected");
    }

    if (selectedSegments.length == 0) {
        mergeButton.prop("disabled", true).fadeOut(400);
    }
    else if (selectedSegments.length == 1) {
        mergeButton.prop("disabled", true).fadeIn(400);
    }
    else {
        mergeButton.prop("disabled", false).fadeIn(400);
    }
}
function tagClickHandler(tag) {
    $(tag).clone().appendTo($(tag).closest("tr").find("td.target"));
}
function targetChangeHandler(e, target_cell) {
    target_cell.removeAttr("class").addClass("draft");
}
function targetKeydownHandler(e, target_cell) {
    if (e.key == "Enter") {
        e.preventDefault();
        if (e.ctrlKey) {
            target_cell.closest("tr").removeClass("draft");
            submitSegment(target_cell, "translated");
        }
    }
    else if (e.ctrlKey) {
        if (e.key == "Insert") {
            target_cell.html(target_cell.closest("tr").find("td.source").html());
        }
    }
    else if ( e.shiftKey || e.key == "Tab") {}
    else {
        target_cell.closest("tr").removeClass("translated").addClass("draft");
    }
};

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
