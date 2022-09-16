var taskQueue = [];
var verbose = true;
var chart;
var smpte_output;

window.onload = function() {
	document.getElementById('uploader').addEventListener('change', addToFileQueue);

	window.addEventListener('dragenter', dragEnterHandler);

	document.getElementById("drop_zone").addEventListener('dragenter', dragEnterHandler);
	document.getElementById("drop_zone").addEventListener('dragleave', dragLeaveHandler);
	document.getElementById("drop_zone").addEventListener('drop', dropHandler);
	document.getElementById("drop_zone").addEventListener('dragover', dragOverHandler);

	smpte_output = document.getElementById("smpte_output");

	document.getElementById('uploader_button').addEventListener('click', () => {document.getElementById('uploader').click();});
};

function dragOverHandler(ev) { ev.preventDefault();}
function dragEnterHandler(ev){ document.getElementById("drop_zone").style.display = "flex";}
function dragLeaveHandler(ev){ document.getElementById("drop_zone").style.display = "none";}

async function dropHandler(ev) {
	dragLeaveHandler();

	// Prevent default behavior (Prevent file from being opened)
	ev.preventDefault();

	if (ev.dataTransfer.items) {
	  // Use DataTransferItemList interface to access the file(s)
	  for (var i = 0; i < ev.dataTransfer.items.length; i++) {
	    // If dropped items aren't files, reject them
	    if (ev.dataTransfer.items[i].kind === 'file') {
	      var file = ev.dataTransfer.items[i].getAsFile();
	      addToQueue(file);
	    }
	  }
	  
	} else {
	  // Use DataTransfer interface to access the file(s)
	  for (var i = 0; i < ev.dataTransfer.files.length; i++) {
	    addToQueue(files[i]);
	  }
	}

	if(taskQueue.length > 0 ) processTaskQueue(taskQueue,updateInterfaceElements,onProgress);
}

function downloadBlob(blob, name = 'file.txt') {
  // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
  const blobUrl = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement("a");

  // Set link's href to point to the Blob URL
  link.href = blobUrl;
  link.download = name;

  // Append link to the body
  document.body.appendChild(link);

  // Dispatch click event on the link
  // This is necessary as link.click() does not work on the latest firefox
  link.dispatchEvent(
    new MouseEvent('click', { 
      bubbles: true, 
      cancelable: true, 
      view: window 
    })
  );

  // Remove link from body
  document.body.removeChild(link);
}

//add a file to te sync queue
function addToQueue(file){
	var inputFile = new MediaFile(file.name);
	inputFile.buffer =  file.arrayBuffer();
	//add a new task to the task queue
	audio_channel = Number(document.getElementById("audio_channel").value)

	taskQueue.push(new DecodeTask(inputFile,audio_channel));

	console.log("Added to queue ",taskQueue);
}

function updateInterfaceElements(){
	console.log("update");
	var myElements = document.getElementsByClassName("result");
	for(var counter = 0; counter < myElements.length; counter++){
		myElements[counter].style.display = "block";
	}
}

//progress of current task
function onProgress(progress){
	const progress_bar = document.getElementById("progress_bar");
	const progress_container = document.getElementById("progress_container");
	if(progress == 100){
	  progress_container.style["visibility"] = "hidden";
	  progress_bar.style["width"] =  "0%";
	  progress_bar.textContent =  "0%";
	}else{
	  progress_container.style["visibility"] = "visible";
	  progress_bar.style["width"] = progress + "%";
	  progress_bar.textContent = progress + "%";
	}
}

function handleStdout(text){
	smpte_output.append(text + "\n");
}

function downloadInfo(taskIndex){
  console.log("Download CSV info file for ",taskIndex);
  const text = smpte_output.textContent;
	var blob = new Blob([text], {type: "text/csv"});
	var file_name = taskQueue[taskIndex].input_file.file_name;
	downloadBlob(blob, file_name +".csv");
}

function addToFileQueue(ev){
    fileList = ev.target.files;
    for (var i = 0; i < fileList.length; i++) {
      console.log(fileList[i].name);
      addToQueue(fileList[i]);
    }
    processTaskQueue(taskQueue,updateInterfaceElements,onProgress);
}

function reset(){
    console.log("clear");
    smpte_output.textContent = "";
    taskQueue = [];
    var myElements = document.getElementsByClassName("result");
		for(var counter = 0; counter < myElements.length; counter++){
			myElements[counter].style.display = "none";
		}
}
