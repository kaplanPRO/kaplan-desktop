function fireOnReady() {
    document.getElementById("btn-segment-merge").onclick = function() {
        let xhttp = new XMLHttpRequest();
        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "/file/"
                     + editorView.getAttribute("cur-f-id");
        let formData = new FormData();
        formData.append("task", "merge_segments");
        formData.append("segment_list", selectedSegments.join(';'));

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                window.fetchSegments(filesView.getAttribute("cur-p-id"), editorView.getAttribute("cur-f-id"));
            }
        }

        xhttp.open("POST", queryURL, true);
        xhttp.send(formData);
    }
    document.getElementById("btn-tm-hits").onclick = function() {
        this.classList.add("active")
        document.getElementById("tm-hits").style.display = "table";
        document.getElementById("btn-tb-hits").classList.remove("active");
        document.getElementById("tb-hits").style.display = "none";
    }
    document.getElementById("btn-tb-hits").onclick = function() {
        this.classList.add("active")
        document.getElementById("tb-hits").style.display = "table";
        document.getElementById("btn-tm-hits").classList.remove("active");
        document.getElementById("tm-hits").style.display = "none";
    }
}

window.selectedTU = null;
window.selectedSegments = [];

function selectSegmentForMerge(segmentHeader) {
    let segmentRow = segmentHeader.parentNode;
    if (selectedTU === null) {
        selectedTU = segmentRow.getAttribute("p-id");
        segmentRow.classList.add("selected");
        selectedSegments.push(segmentHeader.textContent);
    } else {
        if (selectedTU !== segmentRow.getAttribute("p-id")) {
            alert("Segments are not of the same translation unit.");
            console.error("Segments are not of the same translation unit.");
        } else {
            if (segmentRow.classList.contains("selected")) {
                selectedSegments.pop(segmentHeader.textContent);
                segmentRow.classList.remove("selected");
            } else {
                if (!segmentHeader.textContent.includes(selectedSegments)) {
                    selectedSegments.push(segmentHeader.textContent);
                }
                segmentRow.classList.add("selected");
            }
        }
    }
    if (selectedSegments.length > 1) {
        mergeButton.disabled = false;
    } else {
        if (selectedSegments.length === 0) {
            selectedTU = null;
        }
        mergeButton.disabled = true;
    }
}

function submitSegment(target_cell, segment_state) {
    paragraph_no = target_cell.parentNode.getAttribute("p-id");
    segment_no = target_cell.parentNode.getAttribute("id");
    source_segment = "<source>" + target_cell.parentNode.getElementsByClassName("source")[0].innerHTML.replace(/<ph contenteditable="false">\\n<\/ph>/g, "\n") + "</source>";
    target_segment = target_cell.innerHTML.replace(/&nbsp;/g, " ").replace(/<ph contenteditable="false">\\n<\/ph>/g, "\n");

    if (target_segment == "") {
        segment_state = "blank";
        target_segment = "<target/>"
    } else {
      target_segment = "<target>" + target_segment + "</target>";
    }

    if (segment_state == "draft" && !target_cell.parentNode.classList.contains("draft")) {
        return false;
    }

    let xhttp = new XMLHttpRequest();
    let queryURL = "http://127.0.0.1:8000/project/"
                 + filesView.getAttribute("cur-p-id")
                 + "/file/"
                 + editorView.getAttribute("cur-f-id");
    let segmentForm = new FormData();
    segmentForm.append("segment_state", segment_state);
    segmentForm.append("source_segment", source_segment);
    segmentForm.append("target_segment", target_segment);
    segmentForm.append("paragraph_no", paragraph_no);
    if (segment_no != 'N/A') {
        segmentForm.append("segment_no", segment_no);
    }
    segmentForm.append("author_id", "local");

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log("Segment #" + segment_no + " submitted succesfully!");
            target_cell.parentNode.className = segment_state;
        }
    }

    xhttp.open("POST", queryURL, true);
    xhttp.send(segmentForm);
}
function lookupSegment(sourceSegment) {
    const tMHitsTable = document.getElementById("tm-hits");
    const tBHitsTable = document.getElementById("tb-hits");

    let fileURL = "http://127.0.0.1:8000/project/"
                  + filesView.getAttribute("cur-p-id")
                  + "/file/"
                  + editorView.getAttribute("cur-f-id")
                  + "?task=lookup"
                  + "&source_segment="
                  + encodeURIComponent("<source>" + sourceSegment.innerHTML.replace(/<ph contenteditable="false">\\n<\/ph>/g, "\n") + "</source>");

    const parser = new DOMParser();

    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            allHits = JSON.parse(this.responseText);
            translationUnits = allHits.tm;
            tMHitsTable.innerHTML = "";
            [...Object.keys(translationUnits)].forEach(function(i) {
                translationUnit = document.createElement("unit");
                translationUnit.appendChild(parser.parseFromString(translationUnits[i].source, "text/xml").documentElement);
                translationUnit.appendChild(parser.parseFromString(translationUnits[i].target, "text/xml").documentElement);

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

                tr.onclick = function() {
                    activeSegment.getElementsByTagName("td")[1].innerHTML = this.getElementsByTagName("td")[1].innerHTML;
                }
                tMHitsTable.append(tr);
            })

            tBEntries = allHits.tb;
            tBHitsTable.innerHTML = "";
            [...Object.keys(tBEntries)].forEach(function(i) {
                tr = document.createElement("tr");

                th = document.createElement("th");
                th.textContent = tBEntries[i].ratio + "%";
                tr.appendChild(th);

                td = document.createElement("td");
                td.textContent = tBEntries[i].source;
                tr.appendChild(td);

                td = document.createElement("td");
                td.textContent = tBEntries[i].target;
                tr.appendChild(td);

                tBHitsTable.appendChild(tr);
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
    tag.parentNode.parentNode.getElementsByClassName("target")[0].
    innerHTML += tag.outerHTML;
    tag.parentNode.parentNode.classList.remove("translated");
    tag.parentNode.parentNode.classList.add("draft");
}
function targetKeydownHandler(e, target_cell) {
    if (e.key == "Enter") {
        e.preventDefault();
        if (e.ctrlKey) {
            target_cell.parentNode.classList.remove("draft");
            submitSegment(target_cell, "translated");
            jumpToNextSegment = false;
            targetList = [...document.getElementsByClassName("target")].slice(1);
            for (i = 0; i < targetList.length; i++) {
                target = targetList[i];
                if (!jumpToNextSegment) {
                    if (target === target_cell) {
                        jumpToNextSegment = true;
                    }
                } else {
                    if (!target.parentNode.classList.contains("translated")) {
                        target.focus();
                        break;
                    }
                }
            }
        }
    }
    else if (e.ctrlKey) {
        if (e.key == "Insert") {
            target_cell.innerHTML = target_cell.parentNode.getElementsByClassName("source")[0].innerHTML;
        }
    }
    else if ( e.shiftKey || e.key == "Tab") {}
    else {
        target_cell.parentNode.classList.remove("translated");
        target_cell.parentNode.classList.add("draft");
    }
};
if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
};
