build:
	emcc wolflib.c -O2 -o wolflib.js -s EXPORTED_FUNCTIONS=_init,_update_view,_get_view_ptr,_get_map_ptr -s EXPORTED_RUNTIME_METHODS=cwrap,ccall --preload-file 00.map --preload-file VSWAP.WL6

clean:
	rm wolflib.data wolflib.js wolflib.wasm

