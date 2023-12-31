/// <reference path="kendo.all.d.ts" />
import { fetchLogs, logItemSchema, logColumns, logTooltip } from './fetchlog';

import { formatPairs } from './vannillapairs'

var grid: kendo.ui.Grid;
var logData: any;

function GetLocalStorage(key: string, defaulValue: any) {
  const val = localStorage.getItem(key);
  return val ? JSON.parse(val) : defaulValue;
}


async function init() {
  const comboBoxTemplate = `<input id="myComboBox" style="width: 250px;" />`;
  var numericTextBoxTemplate = `<input id='blockNumberInput' style='width: 95px;' title='Number of blocks to load' />`;
  const columnWidths = GetLocalStorage("vanillaswaplog.colWidths", []);
  grid = $("#grid").kendoGrid({
    toolbar: [
      { template: "<button id='btnLoad'>Load</button>" },
      { template: numericTextBoxTemplate },
      { template: comboBoxTemplate },
      { name: 'excel', text: '' },
      { template: '<label id="contractLabel">Contract:</label>' },
    ],
    dataSource: {
      data: logData,
      schema: logItemSchema,
      sort: { field: "Block", dir: "desc" }
    },
    columns: logColumns(columnWidths),
    sortable: true,
    resizable: true,
    filterable: true,
    excel: {
      fileName: "Vanilla_swap_log.xlsx",
      filterable: true,
      allPages: true
    },
    columnResize: function (e: kendo.ui.GridColumnResizeEvent) {
      const columnWidths: number[] = [];
      grid.columns.forEach((column: any) => { columnWidths.push(column.width); });
      localStorage.setItem("vanillaswaplog.colWidths", JSON.stringify(columnWidths));
    },
  }).data("kendoGrid")!;
  grid.thead.kendoTooltip({ filter: "th", content: logTooltip });

  $("#btnLoad").kendoButton({
    icon: "reload",
    click: async function () {
      var comboBox = $("#myComboBox").data("kendoComboBox");
      var contractAddress = comboBox?.value();
      if (!contractAddress) {
        alert("Please select a contract address.");
        return;
      }
      $("#contractLabel").text("Contract: " + contractAddress);
      var numBlocks = $("#blockNumberInput")!.data("kendoNumericTextBox")!.value();
      logData = await fetchLogs(contractAddress, numBlocks);
      if (typeof logData === "string") {
        alert(logData);
      } else {
        grid.dataSource.data(logData);
        $('.k-filterable').each((index, element) => $(element).data("kendoFilterMultiCheck")?._init());
      }
    }
  });

  $("#myComboBox").kendoComboBox({
    dataSource: await formatPairs(),
    dataTextField: "text",
    dataValueField: "value",
    filter: "contains",
    suggest: true,
    index: -1,
    placeholder: "Select contract...",
    change: (e) => {
      var comboBox = e.sender;
      var selectedValue = comboBox.value();
      console.log("Selected address: " + selectedValue);
    }
  });

  $("#blockNumberInput").kendoNumericTextBox({
    format: "#",
    step: 5000,  
    min: 5000,
    value: 10000,
});

}

$(document).on("ready", function () {
  // Call init after DOM is loaded
  init();

  // Resize Grid on browser windows resize
  $(window).on('resize', function () {
    grid?.resize();
  });
});