
const bytes_per_element = 4;

var ffmpegHelper = null;

class MediaFile {

  buffer = null;
  duration = 0;
  file_name = null;

  constructor(file_name) {
    this.file_name = file_name;
  }

  asBlob(){
    return new Blob([this.buffer], { type: 'audio/' + this.extension() })
  }

  extension(){
    return this.file_name.split('.').pop();
  }
}


class DecodeTask{

  processed = false;
  failed = false;
  input_file = null;
  audio_channel = 0;

  log = null;
  running = false;


  constructor(in_file,audio_channel){
    this.input_file = in_file;
    this.audio_channel = audio_channel;

    this.output_file = new MediaFile("out.raw");
  }

  async decode(progressHandler){
    FFmpegSingleton.getInstance();

    //first transcode to f32le raw 16kHz
    await this.transcode(progressHandler);

    const decoder = _ltc_dec_create(16000.0)
    const audio_all_data = this.output_file.buffer; //this.output_file.buffer;

    const audio_block_size = 1024;
    const audio_step_size = 1024;
    
    // Get data byte size, allocate memory on Emscripten heap, and get pointer
    var nDataBytes = audio_block_size * 4;
    var dataPtr = Module._malloc(nDataBytes);
    // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);

    for(var audio_sample_index = 0 ; audio_sample_index < audio_all_data.length  - audio_block_size * 4 ; audio_sample_index  += audio_step_size*4){
      //console.log("Processing",audio_sample_index);
      const audio_block_data = audio_all_data.slice(audio_sample_index,audio_sample_index+(audio_block_size*4));

      dataHeap.set(new Uint8Array(audio_block_data.buffer));
      // Call function and get result
      _ltc_dec_write(decoder,dataHeap.byteOffset,audio_block_size);
    }
    _free(dataPtr);
    _ltc_dec_free(decoder);

    if(this.failed) return;

    this.running = false;
    this.processed = true;
  }

  async transcode(progressHandler){
    console.log("progressHandler",progressHandler);
    this.running = true;
    var prefixIn =  ~~(Math.random() * 10000) + "_";
    var prefixOut = ~~(Math.random() * 10000)+ "_";

    const helper = new FFmpegHelper();
    await helper.initialzeFFmpeg();

    var outputExtension = this.output_file.extension();
    var outputFileName = prefixOut + this.output_file.file_name;
    var inputFileName = prefixIn + this.input_file.file_name;
    var args = [];

    args = ['-i', inputFileName, '-vn' ,'-codec:a', 'pcm_f32le', '-af', 'pan=mono|c0=c' + audio_channel ,'-ac','1','-f','f32le','-ar','16000' ,outputFileName];

    helper.ffmpegProgressHandler = (progress) => {console.log("handled progress", progress);if(progressHandler != null) progressHandler(progress);};

    if(typeof window === `undefined`)
      helper.FS().writeFile(inputFileName, new Uint8Array(this.input_file.buffer));
    else
      helper.FS().writeFile(inputFileName, new Uint8Array(await this.input_file.buffer));

    await helper.run(args);

    const check = helper.FS().readdir('.').find(name => (name === outputFileName));

    if (typeof check !== 'undefined') {
      this.output_file.buffer = helper.FS().readFile(outputFileName);
      this.failed = false;
    }else{
      this.failed = true;
    } 
  }
}

function print(arg){
  console.log("arg arg",arg);
}

async function processTaskQueue(taskQueue,onTaskDone,updateProgress){
  Module.print = print
  for (const index in taskQueue) {
      task = taskQueue[index];
      if(task.processed) continue;

      if(verbose) console.log("Processing task: ",task);
      task.decode(updateProgress);
      //onTaskQueued(index,task);
  }
  onTaskDone()
}

if(typeof window === `undefined`)
module.exports = {MediaFile: MediaFile,  SyncTask: SyncTask };





