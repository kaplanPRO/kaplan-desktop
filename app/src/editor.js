$(document).ready(function () {
    $("button#btn_segment_merge").click(function () {
        $.post(
            "http://127.0.0.1:8000/project/" + $(files_view).attr("cur_p_id") + "/file/" + $(editor_view).attr("cur_f_id"),
            {
                segment_list: selectedSegments.join(';'),
                task: "merge_segments"
            }
        ).done(function() {
            selectedSegments = [];
            $("button#btn_segment_merge").prop("disabled", true).fadeOut(400);
            window.fetchSegments($(files_view).attr("cur_p_id"), $(editor_view).attr("cur_f_id"));
        })
    });
})

let selectedSegments = [];

function submitSegment(target_cell, segment_state) {
    paragraph_no = target_cell.closest("tr").attr("p_id");
    segment_no = target_cell.closest("tr").attr("id");
    source_segment = "<source>" + target_cell.closest("tr").find("td.source").html().replace(/<ph>\\n<\/ph>/g, "\n") + "</source>";
    target_segment = target_cell.html().replace(/&nbsp;/g, " ").replace(/<ph>\\n<\/ph>/g, "\n");

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
        "http://127.0.0.1:8000/project/" + $(files_view).attr("cur_p_id") + "/file/" + $(editor_view).attr("cur_f_id"),
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
function segmentLookup(source_segment, tm_hits_table) {
    $.getJSON(
        "http://127.0.0.1:8000/project/" + $(files_view).attr("cur_p_id") + "/file/" + $(editor_view).attr("cur_f_id"),
        {
            source_segment: source_segment.html(),
            task: "lookup",
        }
    )
    .done(function(data) {
        tm_hits_table.empty();
        $.each(data, function(match, tm_hit) {
            tr = $("<tr>");
            match_th = $("<th>");
            match_th.text(tm_hit.ratio + "%");
            tr.append(match_th);
            source_td = $("<td>");
            source_td.html(tm_hit.source);
            tr.append(source_td);
            target_td = $("<td>");
            target_td.html(tm_hit.target);
            tr.append(target_td);
            tm_hits_table.prepend(tr);
        })
    })
}
function segmentSelect(segmentRow) {
    mergeButton = $("button#btn_segment_merge");
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
}
