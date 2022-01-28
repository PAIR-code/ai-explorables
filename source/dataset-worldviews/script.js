
console.clear();

var ttSel = d3.select("body").selectAppend("div.tooltip.tooltip-hidden");
// For result tables
const columns = ["object", "n", "n correct", "accuracy"];
const rowHeight = 50;
const rowWidth = 100;
const buffer = 2;

const classifierBlobWidth = 50;
const classifierBlobHeight = 460;

function drawShapesWithData(classifier) {
    var divHeight = classifier.class == "show-shapes" ? 250 : 490;

    var c = d3.conventions({
        sel: d3.select("." + classifier.class).html(""),
        width: 1300,
        height: divHeight,
        layers: "ds",
    });

    function runClassifier() {
        classifier.isClassified = true;
        var duration = 3000;
        classifierSel.classed("is-classified", true);
        graphResultsGroup.classed("is-classified", true);

        drawResults();
        buttonSel.text("Reset");

        var minX = d3.min(shapeParams, (d) => d.endX - 50);
        var timer = d3.timer((ms) => {
            if (!classifier.isClassified) {
                timer.stop();
                shapeSel.classed("is-classified", false);
                return;
            }

            var t = d3.easeCubicInOut(ms / duration);
            t = d3.clamp(0, t, 1);

            shapeParams.forEach((d, i) => {
                d.x = d.startX + (d.endX - d.startX) * t;
                d.y = d.startY + (d.endY - d.startY) * t;
                d.isClassified = d.x > minX;
            });

            shapeSel
                .translate((d) => [d.x, d.y])
                .classed("is-classified", (d) => d.isClassified);

            if (t == 1) {
                timer.stop();
            }
        });
    }

    function resetClassifier() {
        shapeSel.translate((d) => [d.startX, d.startY]);
        shapeSel.classed("is-classified", false);
        classifier.isClassified = false;
        shapeSel
            .transition("position")
            .duration(0)
            .translate((d) => [d.startX, d.startY]);
        classifierSel.classed("is-classified", false);
        graphResultsGroup.classed("is-classified", false);
        if (classifier.class != "show-shapes") {
            classifierBlobSel.attr("opacity", 100);
        }

        drawResults();
        buttonSel.text("Run Classifier");
    }

    // Add run/reset button
    var buttonSel = d3
        .select("." + classifier.class + "-button")
        .html("")
        .append("button#run")
        .at({
            type: "button",
            class: "classifier-button",
        })
        .text("Run Classifier")
        .on("click", () => {
            // if already classified, reset
            if (classifier.isClassified) {
                // Resetting
                resetClassifier();
            } else {
                runClassifier();
            }
        });

    // Backgrounds for different classifications
    var classifierSel = c.svg
        .append("g")
        .at({
            class: "classifier",
        })
        .translate([465, 20]);

    classifierSel
        .append("path.classifier-bg-shaded")
        .at({
            d: classifierBgPathTop,
            // fill: "#ccc",
            // stroke: "#000",
        })
        .translate([-50, 0]);

    classifierSel
        .append("text.classifier-bg-text")
        .at({
            fill: "#000",
            textAnchor: "middle",
            dominantBaseline: "central",
            class: "monospace",
        })
        .text("shaded")
        .translate([160, 15]);

    classifierSel
        .append("path.classifier-bg-unshaded")
        .at({
            d: classifierBgPathBottom,
        })
        .translate([-50, 160]);

    classifierSel
        .append("text.classifier-bg-text")
        .at({
            fill: "#000",
            textAnchor: "middle",
            dominantBaseline: "central",
            class: "monospace",
        })
        .text("unshaded")
        .translate([160, 175]);

    // Add the shapes themselves
    var shapeSel = c.svg
        .appendMany("path.shape", shapeParams)
        .at({
            d: (d) => d.path,
            class: (d) => "gt-" + d.gt + " " + d.correctness,
        })
        .translate(function (d) {
            if (classifier.class == "show-shapes") {
                return [d.initialX + 35, d.initialY-20];
            } else {
                return [d.startX, d.startY];
            }
        })
        .call(d3.attachTooltip)
        .on("mouseover", (d) => {
            ttSel.html("");
            if (classifier.usingLabel != "none") {
                ttSel
                    .append("div")
                    .html(
                        `<span class="left">labeled:</span> <span class="monospace right">${toPropertyString(
                            d[classifier.usingLabel],
                            classifier.isRounding
                        ).slice(0, -1)}</span>`
                    );
            }
            var gtSel = ttSel
                .append("div")
                .html(
                    `<span class="left">ground truth:</span> <span class="monospace right">${d.gt}</span>`
                );
            if (classifier.isClassified) {
                ttSel
                    .append("div.labeled-row")
                    .html(
                        `<span class="left">classified as:</span> <span class="monospace right">${d.label}</span>`
                    );

                ttSel
                    .append("div.correct-row")
                    .classed("is-correct-tooltip", d.correctness == "correct")
                    .html(`<br><span>${d.correctness}ly classified</span> `);
            }
            ttSel.classed("tt-text", true);
        });

    // If we're just showing shapes, ignore everything else
    if (classifier.class == "show-shapes") return;

    // Add "classifier" line
    var classifierBlobSel = c.svg
        .append("g")
        .at({
            class: "classifier-blob",
            strokeWidth: 0,
        })
        .translate([378, 20]);

    classifierBlobSel
        .append("line.classifier-blob")
        .at({
            class: "line",
            x1: 27,
            x2: 27,
            y1: 0,
            y2: 464,
            stroke: "#000",
            strokeWidth: 1,
        })
        .style("stroke-dasharray", "5, 5");

    classifierBlobSel
        .append("text.classifier-blob-text")
        .at({
            class: "classifier-blob-text monospace",
            textAnchor: "middle",
            dominantBaseline: "central",
        })
        .text("is_shaded classifier")
        .attr("transform", "translate(30,480) rotate(0)");

    if (classifier.class == "show-shapes") {
        classifierBlobSel.classed("is-classified", true);
    }

    // Draw the results table with accuracies
    // This will be hidden before classifier is run.
    var graphResultsGroup = c.svg
        .append("g")
        .attr("class", "results")
        .translate([-20, 19]);

    function drawResults() {
        // Write text summary
        summarySel = d3
            .select("." + classifier.class + "-summary")
            .html(summaries[classifier.class])
            .translate([0, 20]);
        summarySel.classed("summary-text", true);
        summarySel.classed("is-classified", classifier.isClassified);

        if (!classifier.isClassified) {
            c.layers[0].html("");
            classifier.wasClassified = false;
            return;
        }

        // Access results, which are calculated in shapes.js.
        // If there are none, draw nothing.
        results = allResults[classifier.class];
        if (!results) return;

        // Figure out which shapes should be highlighted on mouseover
        // This depends on whether we're "rounding" edge case examples.
        function isMatch(rowName, labelName, isRounding) {
            // Not filtering at all
            if (rowName == "shape") {
                return true;
            }
            if (isRounding == true) {
                // No "other" category
                return labelName.includes(toOriginalString(rowName))
                    ? true
                    : false;
            } else {
                // There is an "other" category, prefixed by "rt_"
                if (labelName == toOriginalString(rowName)) {
                    return true;
                } else if (
                    labelName.includes("rt_") &&
                    rowName == "other shapes"
                ) {
                    return true;
                }
                return false;
            }
        }

        // Color the last row of each table
        function getColor(d, i) {
            if (i != 3) {
                // not last index
                return "#e6e6e6";
            } else {
                var scaleRowValue = d3
                    .scaleLinear()
                    .domain([0.3, 1.0])
                    .range([0, 1]);
                return d3.interpolateRdYlGn(scaleRowValue(d));
            }
        }

        // Adjust text color for visibility
        function getTextColor(d, i) {
            if (i != 3) {
                // not last index
                return "#000000";
            } else {
                var bgColor = getColor(d, i);
                if (d < 0.3) {
                    // Alternative: use a brighter color?
                    // return d3.rgb(bgColor).brighter(-2);
                    return "#FFCCD8";
                } else {
                    // Alternative: use a darker color?
                    // return d3.rgb(bgColor).darker(2);
                    return "#000000";
                }
            }
        }

        // Draw results table
        var tableSel = c.layers[0]
            .html("")
            .raise()
            .st({ width: 400 })
            .append("div")
            .translate([0, 10])
            .append("table.results-table.monospace")
            .st({ width: 400 });

        var header = tableSel
            .append("thead")
            .append("tr")
            .appendMany("th", columns)
            .text((d) => d);

        var rowSel = tableSel
            .appendMany("tr", results)
            .at({
                class: "row monospace",
            })
            .on("mouseover", (row) => {
                if (classifier.class == "default-classifier") {
                    return;
                }
                rowSel.classed("active", (d) => d == row);
                shapeSel.classed("shape-row-unhighlighted", function (d) {
                    return !isMatch(
                        row.object,
                        d[classifier.usingLabel],
                        (isRounding = classifier.isRounding)
                    );
                });
            })
            .on("mouseout", (row) => {
                rowSel.classed("active", function (d) {
                    if (d == row) {
                        return false;
                    }
                });
                if (classifier.isClassified) {
                    shapeSel.classed("shape-row-unhighlighted", 0);
                }
            });

        rowSel
            .appendMany("td", (result) =>
                columns.map((column) => result[column])
            )
            .text((d) => d)
            .st({
                backgroundColor: getColor,
                color: getTextColor,
            });

        header.style("opacity", 0);
        rowSel.style("opacity", 0);

        // If the classifier has already been run before, draw results right away.
        // Otherwise, wait for other animation to run before drawing results.
        var initialDelay = classifier.wasClassified ? 0 : 2000;
        classifier.wasClassified = true;

        header
            .transition()
            .delay(initialDelay)
            .duration(1000)
            .style("opacity", 1);
        rowSel
            .transition()
            .delay(function (d, i) {
                return initialDelay + i * 200;
            })
            .duration(1000)
            .style("opacity", 1);
    }

    // Draw the dropdowns for selecting different labels
    function drawDropdown() {
        if (!classifier.options) return;

        ["rounding", "category"].forEach(function (classifierType) {
            if (!classifier.options[classifierType]) return;
            var sel = d3
                .select("#" + classifier.class + "-select-" + classifierType)
                .html("");
            sel.classed("dropdown", true);
            sel.appendMany("option", classifier.options[classifierType])
                .at({
                    value: function (d) {
                        return d.value;
                    },
                })
                .text((d) => d.label);
            sel.on("change", function () {
                if (classifierType == "rounding") {
                    classifier.isRounding = toBool(this.value);
                } else {
                    classifier.usingLabel = this.value;
                }
                updateResults();
                drawResults();
            });
        });
    }
    drawDropdown();
    updateResults();
    drawResults();

    // For continuity, auto-run the second two classifiers
    if (
        classifier.class == "second-classifier" ||
        classifier.class == "final-classifier"
    ) {
        runClassifier();
    }
}

// Draw the "Labels Tell Stories" section
function drawConclusion() {
    function drawNewspapers() {
        d3.select(".conclusion-newspapers").html(function () {
            var imgPath =
                "img/newspapers_" +
                document.getElementById("conclusion-select-category").value;
            return (
                '<img src="' +
                imgPath +
                '.png" class="newspaper-image" alt="Newspapers with headlines about bias and fairness in shape data." width=400></img>'
            );
        });
    }

    function drawInterface() {
        d3.select(".conclusion-interface").html(function () {
            var imgPath =
                "img/confusing_" +
                document.getElementById("conclusion-select-category").value;
            return (
                '<center><img class="interface-image" width="638" height="268" src="' +
                imgPath +
                '.png" alt="A shape that is difficult to classify with several checkboxes, none of which describe the shape. Next to the interface is a text box with a single question mark in it." srcset="' +
                imgPath +
                '.svg"></img></center>'
            );
        });
    }

    function drawConclusionSummary() {
        classifierSel = d3
            .select(".conclusion-summary")
            .html(summaries["conclusion"]);
        classifierSel.classed("summary-text is-classified", true);
    }

    function drawDropdown() {
        var sel = d3.select("#conclusion-select-category").html("");
        sel.classed("dropdown", true);
        sel.appendMany("option", conclusionOptions.category)
            .at({
                value: function (d) {
                    return d.value;
                },
            })
            .text((d) => d.label);
        // sel.attr('select', 'circles, triangles, and rectangles');
        sel.on("change", function (d) {
            makeConclusionUpdates();
        });
    }

    function makeConclusionUpdates() {
        updateResults();
        drawNewspapers();
        drawInterface();
        drawConclusionSummary();
    }
    drawDropdown();
    makeConclusionUpdates();
}

// Handle the parameters everywhere classifiers are drawn
var classifiers = [
    {
        // Just the initial display of shapes, not interactive
        class: "show-shapes",
        colorBy: (d) => d.correctness,
        isClassified: false,
        isRounding: false,
        usingLabel: "none",
    },
    {
        class: "default-classifier",
        colorBy: (d) => d.correctness,
        isClassified: false,
        isRounding: false,
        usingLabel: "none",
    },
    {
        class: "second-classifier",
        colorBy: (d) => d.correctness,
        isClassified: false,
        isRounding: true,
        usingLabel: "shape_name",
        options: {
            rounding: [
                { label: "with their best guess", value: true },
                { label: 'as "other"', value: false },
            ],
        },
    },
    {
        class: "final-classifier",
        colorBy: (d) => d.correctness,
        isClassified: false,
        isRounding: true,
        usingLabel: "shape_name",
        options: {
            rounding: [
                { label: "with our best guess", value: true },
                { label: 'as "other"', value: false },
            ],
            category: [
                {
                    label: "circles, triangles, or rectangles",
                    value: "shape_name",
                },
                { label: "pointy shapes or round shapes", value: "pointiness" },
                { label: "small shapes or big shapes", value: "size" },
                { label: "just shapes", value: "none" },
            ],
        },
    },
];

// "Labels Tell Stories" dropdown options
var conclusionOptions = {
    category: [
        { label: "circles, triangles, and rectangles", value: "shape_name" },
        { label: "pointy shapes and round shapes", value: "pointiness" },
        { label: "small shapes and big shapes", value: "size" },
    ],
};

classifiers.forEach(drawShapesWithData);
drawConclusion();

// These images are loaded invisibly so they appear seamlessly on dropdown change
const preloadImages = [
    "img/confusing_pointiness.png",
    "img/confusing_pointiness.svg",
    "img/confusing_shape_name.png",
    "img/confusing_shape_name.svg",
    "img/confusing_size.png",
    "img/confusing_size.svg",
    "img/interface_default.png",
    "img/interface_default.svg",
    "img/interface_shape_name_false.png",
    "img/interface_shape_name_false.svg",
    "img/interface_shape_name_true.png",
    "img/interface_shape_name_true.svg",
    "img/newspapers_pointiness.png",
    "img/newspapers_pointiness.svg",
    "img/newspapers_shape_name.png",
    "img/newspapers_shape_name.svg",
    "img/newspapers_size.png",
    "img/newspapers_size.svg",
];

d3.select(".preload-dropdown-img")
    .html("")
    .appendMany("img", preloadImages)
    .at({ src: (d) => d });
