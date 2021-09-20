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
function openCommentForm(buttonElement) {
    buttonElement.classList.add("hidden");
    if (buttonElement.nextSibling){
      buttonElement.nextSibling.classList.add("hidden");
    }

    noteDiv = document.createElement("div");
    noteDiv.classList.add("note");

    noteForm = document.createElement("form");

    noteLabel = document.createElement("label");
    noteLabel.setAttribute("for", "comment");
    noteLabel.textContent = "Comment:";
    noteForm.appendChild(noteLabel);

    noteTextarea = document.createElement("textarea");
    noteTextarea.setAttribute("name", "comment");
    noteForm.appendChild(noteTextarea);

    submitButton = document.createElement("button");
    submitButton.setAttribute("type", "submit");
    submitButton.textContent = "Submit";
    noteForm.appendChild(submitButton);

    cancelButton = document.createElement("button");
    cancelButton.className = "cancel";
    cancelButton.setAttribute("type", "button");
    cancelButton.textContent = "Cancel";
    cancelButton.onclick = function() {
        this.parentNode.parentNode.parentNode.getElementsByTagName("button")[0].classList.remove("hidden");
        this.parentNode.parentNode.parentNode.getElementsByTagName("button")[1].classList.remove("hidden");
        this.parentNode.parentNode.remove();
    }
    noteForm.appendChild(cancelButton);

    noteDiv.appendChild(noteForm);
    buttonElement.parentNode.appendChild(noteDiv);

    noteForm.onsubmit = function(e) {
        e.preventDefault();
        noteFormData = new FormData(noteForm);
        noteFormData.append("segment", this.parentNode.parentNode.parentNode.id);
        noteFormData.append("author", username);
        noteFormData.append("task", "add_comment");

        if (noteFormData.get("comment") === "") {
            this.parentNode.parentNode.getElementsByTagName("button")[0].classList.remove("hidden");
            this.parentNode.parentNode.getElementsByTagName("button")[1].classList.remove("hidden");
            this.parentNode.remove();

            return false;
        }

        let xhttp = new XMLHttpRequest();
        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "/file/"
                     + editorView.getAttribute("cur-f-id");

         xhttp.onreadystatechange = function() {
             if (this.readyState == 4 && this.status == 200) {
                 console.log("Comment submitted succesfully!");

                 noteDiv = document.createElement("div");
                 noteDiv.classList.add("note");

                 noteP = document.createElement("p");
                 noteP.textContent = noteFormData.get("comment");
                 noteDiv.appendChild(noteP);

                 noteForm.parentNode.parentNode.insertBefore(noteDiv, noteForm.parentNode.parentNode.getElementsByTagName("button")[0]);

                 noteForm.parentNode.parentNode.getElementsByTagName("button")[0].classList.remove("hidden");
                 noteForm.parentNode.parentNode.getElementsByTagName("button")[1].classList.remove("hidden");

                 noteForm.parentNode.remove();
             }
         }

         xhttp.open("POST", queryURL, true);
         xhttp.send(noteFormData);

    }
}
function openLQIForm(buttonElement) {
    buttonElement.classList.add("hidden");
    buttonElement.previousSibling.classList.add("hidden");

    lQIDiv = document.createElement("div");
    lQIDiv.classList.add("note");

    lQIForm = document.createElement("form");

    typeLabel = document.createElement("label");
    typeLabel.setAttribute("for", "type");
    typeLabel.textContent = "Type:";
    lQIForm.appendChild(typeLabel);

    typeInput = document.createElement("input");
    typeInput.setAttribute("name", "type");
    typeInput.setAttribute("type", "text");
    lQIForm.appendChild(typeInput);

    severityLabel = document.createElement("label");
    severityLabel.setAttribute("for", "severity");
    severityLabel.textContent = "Severity:";
    lQIForm.appendChild(severityLabel);

    severityInput = document.createElement("input");
    severityInput.setAttribute("name", "severity");
    severityInput.setAttribute("type", "number");
    severityInput.setAttribute("step", "0.01");
    severityInput.setAttribute("max", "1.00");
    severityInput.setAttribute("min", "0.00");
    severityInput.setAttribute("placeholder", "0.00");
    severityInput.setAttribute("title", "0.00-1.00")
    lQIForm.appendChild(severityInput);

    noteLabel = document.createElement("label");
    noteLabel.setAttribute("for", "comment");
    noteLabel.textContent = "Comment:";
    lQIForm.appendChild(noteLabel);

    noteTextarea = document.createElement("textarea");
    noteTextarea.setAttribute("name", "comment");
    lQIForm.appendChild(noteTextarea);

    submitButton = document.createElement("button");
    submitButton.setAttribute("type", "submit");
    submitButton.textContent = "Submit";
    lQIForm.appendChild(submitButton);

    cancelButton = document.createElement("button");
    cancelButton.className = "cancel";
    cancelButton.setAttribute("type", "button");
    cancelButton.textContent = "Cancel";
    cancelButton.onclick = function() {
        this.parentNode.parentNode.parentNode.getElementsByTagName("button")[0].classList.remove("hidden");
        this.parentNode.parentNode.parentNode.getElementsByTagName("button")[1].classList.remove("hidden");
        this.parentNode.parentNode.remove();
    }
    lQIForm.appendChild(cancelButton);

    lQIDiv.appendChild(lQIForm);
    buttonElement.parentNode.appendChild(lQIDiv);

    lQIForm.onsubmit = function(e) {
        e.preventDefault();

        lQIFormData = new FormData(lQIForm);


        if (lQIFormData.get("type") == "") {
            this.parentNode.parentNode.getElementsByTagName("button")[0].classList.remove("hidden");
            this.parentNode.parentNode.getElementsByTagName("button")[1].classList.remove("hidden");
            this.parentNode.remove();

            return false;
        }

        lQIFormData.append("tu", this.parentNode.parentNode.parentNode.getAttribute("p-id"));
        lQIFormData.append("segment", this.parentNode.parentNode.parentNode.id);
        lQIFormData.append("author", username);
        lQIFormData.append("task", "add_lqi");

        let xhttp = new XMLHttpRequest();
        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "/file/"
                     + editorView.getAttribute("cur-f-id");

         xhttp.onreadystatechange = function() {
             if (this.readyState == 4 && this.status == 200) {
                 console.log("LQI submitted succesfully!");

                 noteDiv = document.createElement("div");
                 noteDiv.classList.add("note");

                 noteP = document.createElement("p");
                 noteP.textContent = lQIFormData.get("type");
                 noteDiv.appendChild(noteP);

                 noteP = document.createElement("p");
                 noteP.textContent = lQIFormData.get("comment");
                 noteDiv.appendChild(noteP);

                 lQIForm.parentNode.parentNode.insertBefore(noteDiv, lQIForm.parentNode.parentNode.getElementsByTagName("button")[0]);

                 lQIForm.parentNode.parentNode.getElementsByTagName("button")[0].classList.remove("hidden");
                 lQIForm.parentNode.parentNode.getElementsByTagName("button")[1].classList.remove("hidden");

                 lQIForm.parentNode.remove();
             }
         }

         xhttp.open("POST", queryURL, true);
         xhttp.send(lQIFormData);

    }
}
function resolveComment(closeSpan) {
    noteDiv = closeSpan.parentNode;

    let noteFormData = new FormData();
    noteFormData.append("segment", noteDiv.getAttribute("segment"));
    noteFormData.append("comment", noteDiv.id);
    noteFormData.append("author", username);
    noteFormData.append("task", "resolve_comment");

    let xhttp = new XMLHttpRequest();
    let queryURL = "http://127.0.0.1:8000/project/"
                 + filesView.getAttribute("cur-p-id")
                 + "/file/"
                 + editorView.getAttribute("cur-f-id");

     xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
            noteDiv.remove();
         }
     }

     xhttp.open("POST", queryURL, true);
     xhttp.send(noteFormData);

}
function resolveLQI(closeSpan) {
    lQIDiv = closeSpan.parentNode;

    let lQIFormData = new FormData();
    lQIFormData.append("segment", lQIDiv.getAttribute("segment"));
    lQIFormData.append("comment", lQIDiv.id);
    lQIFormData.append("author", username);
    lQIFormData.append("task", "resolve_lqi");

    let xhttp = new XMLHttpRequest();
    let queryURL = "http://127.0.0.1:8000/project/"
                 + filesView.getAttribute("cur-p-id")
                 + "/file/"
                 + editorView.getAttribute("cur-f-id");

     xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
            noteDiv.remove();
         }
     }

     xhttp.open("POST", queryURL, true);
     xhttp.send(lQIFormData);
}
function submitSegment(target_cell, segment_state) {
    paragraph_no = target_cell.parentNode.getAttribute("p-id");
    segment_no = target_cell.parentNode.getAttribute("id");
    source_segment = "<source>" + target_cell.parentNode.getElementsByClassName("source")[0].innerHTML.replace(/&nbsp;/g, " ").replace(/<ph draggable="true" contenteditable="false">\\n<\/ph>/g, "\n") + "</source>";
    target_segment = target_cell.innerHTML.replace(/&nbsp;/g, " ").replace(/<ph draggable="true" contenteditable="false">\\n<\/ph>/g, "\n");

    if (target_segment == "") {
        segment_state = "blank";
        target_segment = "<target/>"
    } else {
      target_segment = "<target>" + target_segment + "</target>";
    }

    //if (segment_state == "draft" && !target_cell.parentNode.classList.contains("draft")) {
    //    return false;
    //}

    let xhttp = new XMLHttpRequest();
    let queryURL = "http://127.0.0.1:8000/project/"
                 + filesView.getAttribute("cur-p-id")
                 + "/file/"
                 + editorView.getAttribute("cur-f-id");
    let segmentForm = new FormData();
    segmentForm.append("editor_mode", editorMode);
    segmentForm.append("segment_state", segment_state);
    segmentForm.append("source_segment", source_segment);
    segmentForm.append("target_segment", target_segment);
    segmentForm.append("paragraph_no", paragraph_no);
    if (segment_no != 'N/A') {
        segmentForm.append("segment_no", segment_no);
    }
    segmentForm.append("author_id", window.username);

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log("Segment #" + segment_no + " submitted succesfully!");
            target_cell.parentNode.className = segment_state;
        } else if (this.readyState == 4 && this.status != 200) {
            console.error("Segment #" + segment_no + " not submitted succesfully!");
            target_cell.parentNode.className = 'error';
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
                  + encodeURIComponent("<source>" + sourceSegment.innerHTML.replace(/&nbsp;/g, " ").replace(/<ph draggable="true" contenteditable="false">\\n<\/ph>/g, "\n") + "</source>");

    const parser = new DOMParser();

    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            allHits = JSON.parse(this.responseText);
            translationUnits = allHits.tm;
            tMHitsTable.innerHTML = "";
            [...Object.keys(translationUnits)].forEach(function(i) {
                translationUnit = document.createElement("unit");
                translationUnit.appendChild(parser.parseFromString(translationUnits[i].difference, "text/xml").documentElement);
                translationUnit.appendChild(parser.parseFromString(translationUnits[i].target, "text/xml").documentElement);

                tr = document.createElement("tr");
                tr.setAttribute("title", "Source: " + translationUnits[i].origin)

                th = document.createElement("th");
                th.textContent = translationUnits[i].ratio + "%";
                tr.appendChild(th);

                td = document.createElement("td");
                td.innerHTML = translationUnit.getElementsByTagName("difference")[0].innerHTML
                               .replace(/\\n/g, "<kaplan:placeholder>")
                               .replace(/\n/g, "<ph>\\n</ph>")
                               .replace(/<kaplan:placeholder>/g, "\\n")
                               .replace(/<span change/g, "<span class");
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
                        tag.draggable = "true";
                    })
                })

                tr.onclick = function() {
                    activeSegment.getElementsByTagName("td")[1].innerHTML = this.getElementsByTagName("td")[1].innerHTML;
                    activeSegment.className = "draft";
                }
                tMHitsTable.append(tr);
            })

            tBEntries = allHits.tb;
            tBHitsTable.innerHTML = "";
            [...Object.keys(tBEntries)].forEach(function(i) {
                tr = document.createElement("tr");
                tr.setAttribute("title", "Source: " + tBEntries[i].origin)

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
    tag.parentNode.parentNode.getElementsByClassName("target")[0].focus();
    document.execCommand('selectAll', false, null);
    document.getSelection().collapseToEnd();
}
function targetKeydownHandler(e, target_cell) {
    if (e.key == "Enter") {
        e.preventDefault();
        if (e.ctrlKey) {
            target_cell.parentNode.classList.remove("draft");
            submitSegment(target_cell, "translated");
            jumpToNextConfirmedSegment = !e.shiftKey;
            targetList = [...document.getElementsByClassName("target")].slice(1);
            currentId = targetList.findIndex(function(element){return element==target_cell})
            for (i = currentId+1; i < targetList.length; i++) {
                target = targetList[i];
                if (!target.parentNode.classList.contains("translated") && jumpToNextConfirmedSegment) {
                    target.focus();
                    break;
                }
            }
        }
    }
    else if (e.ctrlKey) {
        if (e.key == "Insert") {
            target_cell.innerHTML = target_cell.parentNode.getElementsByClassName("source")[0].innerHTML;
        }
    }
    else if (e.key == "Tab") {
        e.preventDefault();
        targetList = [...document.getElementsByClassName("target")].slice(1);
        currentId = targetList.findIndex(function(element){return element==target_cell})
        if (currentId < targetList.length-1) {
            targetList[currentId+1].focus();
        }
    }
    else if ( e.shiftKey) {}
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
