#include <stdio.h>
#include <stdlib.h>
#include <assert.h>

#include "../libltc/src/ltc.h"
#include "../libltc/src/encoder.h"
#include "../libltc/src/decoder.h"


#define BUFFER_SIZE (1024)

typedef struct LTCDec LTCDec;

struct LTCDec{
	long int total;
	float audio_sample_rate;
	LTCDecoder *decoder;
};

LTCDec* ltc_dec_create(float audio_sample_rate){
	//queue_size length of the internal queue to store decoded frames
	int queue_size = 32;
	int apv = 1920;

	LTCDec *dec = malloc(sizeof(LTCDec));

	dec->audio_sample_rate= audio_sample_rate;
	dec->decoder = ltc_decoder_create(apv, queue_size);
	dec->total = 0;

	return dec;
}

void ltc_dec_write(LTCDec * dec,float * sound, size_t n){
	LTCFrameExt frame;

	//printf("Processing %d samples, total %d, first sample %f \n",n,dec->total,sound[0]);

	ltc_decoder_write_float(dec->decoder, sound, n, dec->total);

	while (ltc_decoder_read(dec->decoder, &frame)) {
		SMPTETimecode stime;

		ltc_frame_to_time(&stime, &frame.ltc, 1);

		//date info
		printf("%04d-%02d-%02d ; ",
			((stime.years < 67) ? 2000+stime.years : 1900+stime.years),
			stime.months,
			stime.days
		);

		//smpte info
		printf("%02d:%02d:%02d%c%02d ; ",
				stime.hours,
				stime.mins,
				stime.secs,
				(frame.ltc.dfbit) ? '.' : ':',
				stime.frame
		);	

		//user info?

		//time info
		printf("%8lld ; %8lld ; %.03f ; %.03f ; %s\n",
				frame.off_start,
				frame.off_end,
				frame.off_start / dec->audio_sample_rate,
				frame.off_end / dec->audio_sample_rate,
				frame.reverse ? "  R" : ""
		);
	}

	//ltc_decoder_queue_flush(dec->decoder);
	dec->total += n;
}

void ltc_dec_free(LTCDec * dec){
	ltc_decoder_free(dec->decoder);
	free(dec);
}

void process(char* filename){
	float sound[BUFFER_SIZE];
	size_t n;
	FILE* f;

	f = fopen(filename, "r");
	if (!f) {
		fprintf(stderr, "error opening '%s'\n", filename);
		return;
	}

	//actual decoding

	LTCDec* dec = ltc_dec_create(48000.0f);
	do {
    	n = fread(sound, sizeof(float), BUFFER_SIZE, f);
		ltc_dec_write(dec, sound, n);
		
	} while (n);
	fclose(f);

	ltc_dec_free(dec);	
}

int main(int argc, char *argv[]) {
	process(argv[1]);
}
