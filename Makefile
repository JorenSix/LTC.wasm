web:
	mkdir -p browser/wasm/ltc.wasm
	emcc -o browser/wasm/ltc.wasm/ltcdec.html -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
		-s EXPORTED_FUNCTIONS="['_malloc','_free','_ltc_dec_create','_ltc_dec_create','_ltc_dec_write','_ltc_dec_free']" \
		src/ltcdec.c \
		libltc/src/decoder.c \
		libltc/src/encoder.c \
		libltc/src/ltc.c \
		libltc/src/timecode.c \
		-O3 -Wall -lm -lc -W -I.

plain:
	gcc -c src/ltcdec.c 				-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/decoder.c			-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/encoder.c			-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/ltc.c    			-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/timecode.c		-W -Wall -std=c11 -pedantic -O2
	mkdir -p bin
	gcc -o bin/ltc_dec *.o 				-lc -lm -ffast-math -pthread


libltc:
	git clone --depth 1 https://github.com/x42/libltc.git

plain:
	gcc -c src/ltcdec.c 				-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/decoder.c			-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/encoder.c			-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/ltc.c    			-W -Wall -std=c11 -pedantic -O2
	gcc -c libltc/src/timecode.c		-W -Wall -std=c11 -pedantic -O2
	mkdir -p bin
	gcc -o bin/ltc_dec *.o 				-lc -lm -ffast-math -pthread

clean:
	- rm -rf libltc
	- rm *o
	- rm bin/*
