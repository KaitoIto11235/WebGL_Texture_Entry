document.addEventListener('DOMContentLoaded', function () {
    // HTMLからcanvas要素を取得する
    const canvas = document.getElementById('canvas');
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    // 各種エレメントへの参照を取得
    const elmTransparency = document.getElementById('transparency');
	const elmAdd          = document.getElementById('add');
	const elmRange        = document.getElementById('range');


    // canvas要素からwebglコンテキストを取得する
    const gl = canvas.getContext('webgl');
    // WebGLコンテキストが取得できたかどうか調べる
    if (!gl) {
        alert('webgl not supported!');
        return;
    }

    // 頂点シェーダとフラグメントシェーダの生成
    // シェーダ作成→ソース割り当て→コンパイル
    const v_shader = create_shader('vertexShader');
    const f_shader = create_shader('fragmentShader');
    console.log(v_shader);
    console.log(f_shader);
    // プログラムオブジェクトの生成とリンク
    // シェーダをプログラムオブジェクトに割り当て、リンクする
    const prg = create_program(v_shader, f_shader);

    let attLocation = new Array(2);
    // attributeLocationの取得、positionが何番目のAttributeかを返す
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'color');
    attLocation[2] = gl.getAttribLocation(prg, 'textureCoord');

    const attStride = new Array(2);
    // attribute1の要素数(この場合は xyz の3要素)
    attStride[0] = 3;
    attStride[1] = 4;
    attStride[2] = 2;

    // 頂点の位置
    const position = [
        -1.0,  1.0,  0.0,
        1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
        1.0, -1.0,  0.0
    ];

    // 頂点色
    const color = [
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        0.0, 0.0, 1.0, 1.0
    ];

    // テクスチャ座標
    const textureCoord = [
        0.0, 0.0,
        3.0, 0.0,
        0.0, 2.0,
        3.0, 2.0
    ];

    // 頂点インデックス
    const index = [
        0, 1, 2,
        3, 2, 1
    ];

    // canvasを初期化する色を設定する
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // canvasを初期化する際の深度を設定する
    gl.clearDepth(1.0);
    // canvasを初期化する
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    // VBOとIBOの生成
    const vPosition_vbo = create_vbo(position);
    const vColor_vbo = create_vbo(color);
    const vTextureCoord = create_vbo(textureCoord);
    const VBOList = [vPosition_vbo, vColor_vbo, vTextureCoord];
    const vIndex = create_ibo(index)

    // VBOとIBOの登録
    set_attribute(VBOList, attLocation, attStride);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vIndex);

    // uniformLocationを配列に取得
    let uniLocation = new Array();
    // uniformLocationの取得　
    //prgオブジェクトにあるシェーダのuniform変数’mvpMatrix’が
    //uniform変数の中で何番目のものかを取得
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'vertexAlpha');
    uniLocation[2] = gl.getUniformLocation(prg, 'texture0');
    uniLocation[3] = gl.getUniformLocation(prg, 'useTexture');

    // minMatrix.js を用いた行列関連処理
    // matIVオブジェクトを生成
    let m = new matIV();
    // 各種行列の生成と初期化
    let mMatrix = m.identity(m.create());
    let vMatrix = m.identity(m.create());
    let pMatrix = m.identity(m.create());
    let tmpMatrix = m.identity(m.create());
    let mvpMatrix = m.identity(m.create());
    
    // ビュー座標変換行列
    m.lookAt([0.0, 0.0, 5.0], [0, 0, 0], [0, 1, 0], vMatrix);
    // プロジェクション座標変換行列
    m.perspective(45, canvas.width / canvas.height, 0.1, 100, pMatrix);
    // ビュー×プロジェクション座標変換行列を完成させる
    m.multiply(pMatrix, vMatrix, tmpMatrix);


    // カリングを有効に
    //gl.enable(gl.CULL_FACE);
    // 深度テストを有効に
    gl.enable(gl.DEPTH_TEST);
    // 深度テストの評価方法の指定
    gl.depthFunc(gl.LEQUAL);
    
    // 有効にするテクスチャユニットを指定
    gl.activeTexture(gl.TEXTURE0);
    // テクスチャ用変数の宣言
    let texture0 = null;
    // テクスチャを生成
    create_texture('texture0.png', 0);

    // カウンタの宣言
    let count = 0;

    // 恒常ループ
    (function(){
        // エレメントから値を取得しブレンドタイプを設定
        if(elmTransparency.checked)[blend_type(0)]
        if(elmAdd.checked)[blend_type(1)]
        // エレメントからα成分を取得
        const vertexAlpha = parseFloat(elmRange.value / 100);

        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        count++;
        // カウンタを元にラジアンと各種座標を算出
        const rad1 = (count % 360) * Math.PI / 180;
        const rad2 = ((count/2) % 360) * Math.PI / 180;

        // モデル座標変換行列の生成
		m.identity(mMatrix);
		m.translate(mMatrix, [0.25, 0.25, -0.25], mMatrix);
		m.rotate(mMatrix, rad1, [0, 1, 0], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		
		// テクスチャのバインド
		gl.bindTexture(gl.TEXTURE_2D, texture0);

        // テクスチャパラメータの設定
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		
		// ブレンディングを無効にする
		gl.disable(gl.BLEND);
		
		// uniform変数の登録と描画
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniform1f(uniLocation[1], 1.0);
		gl.uniform1i(uniLocation[2], 0);
		gl.uniform1i(uniLocation[3], true);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
		

        

        // モデル座標変換行列の生成
		m.identity(mMatrix);
		m.translate(mMatrix, [-0.25, -0.25, 0.25], mMatrix);
		m.rotate(mMatrix, rad2, [0, 0, 1], mMatrix);
		m.multiply(tmpMatrix, mMatrix, mvpMatrix);
		
		// テクスチャのバインドを解除
		gl.bindTexture(gl.TEXTURE_2D, null);
		
		// ブレンディングを有効にする
		gl.enable(gl.BLEND);
		
		// uniform変数の登録と描画
		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniform1f(uniLocation[1], vertexAlpha);
		gl.uniform1i(uniLocation[2], 0);
		gl.uniform1i(uniLocation[3], false);
		gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);


        // コンテキストの再描画
        gl.flush();
        
        // ループのために再帰呼び出し
        setTimeout(arguments.callee, 1000 / 50);
    })();


    // シェーダを生成する関数
    function create_shader(id){
        // シェーダを格納する変数
        let shader;
        
        // HTMLからscriptタグへの参照を取得
        let scriptElement = document.getElementById(id);
        
        // scriptタグが存在しない場合は抜ける
        if(!scriptElement){return;}
        
        // scriptタグのtype属性をチェック
        switch(scriptElement.type){
            
            // 頂点シェーダの場合
            case 'x-shader/x-vertex':
                shader = gl.createShader(gl.VERTEX_SHADER);
                break;
                
            // フラグメントシェーダの場合
            case 'x-shader/x-fragment':
                shader = gl.createShader(gl.FRAGMENT_SHADER);
                break;
            default :
                return;
        }
        
        // 生成されたシェーダにソースを割り当てる
        gl.shaderSource(shader, scriptElement.text);
        
        // シェーダをコンパイルする
        gl.compileShader(shader);
        
        // シェーダが正しくコンパイルされたかチェック
        if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            
            // 成功していたらシェーダを返して終了
            return shader;
        }else{
            
            // 失敗していたらエラーログをアラートする
            alert(gl.getShaderInfoLog(shader));
        }
    }

    // プログラムオブジェクトを生成しシェーダをリンクする関数
    // プログラムオブジェクトとは、頂点シェーダからフラグメントシェーダ、またWebGLプログラムと各シェーダとのデータのやり取りを管理するオブジェクト
    function create_program(vs, fs){
        // プログラムオブジェクトの生成
        let program = gl.createProgram();
        
        // プログラムオブジェクトにシェーダを割り当てる
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        
        
        // シェーダをリンク
        gl.linkProgram(program);
        
        // シェーダのリンクが正しく行なわれたかチェック
        if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        
            // 成功していたらプログラムオブジェクトを有効にする
            gl.useProgram(program);
            
            // プログラムオブジェクトを返して終了
            return program;
        }else{
            
            // 失敗していたらエラーログをアラートする
            alert(gl.getProgramInfoLog(program));
        }
    }

    // VBOを生成する関数
    // 頂点バッファは頂点に関する情報を保存できる記憶領域であり、ここに転送されたデータが、紐づけられたattribute変数に渡される
    function create_vbo(data){
        // バッファオブジェクトの生成
        let vbo = gl.createBuffer();
        
        // WebGLにバッファをバインドする。こうすることで、バッファを（WebGLから？）操作できる
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        
        // バッファにデータをセット
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        
        // バッファのバインドを無効化。WebGLにバインドできるバッファは一度につき一つだけだから。
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // 生成した VBO を返して終了
        return vbo;
    }

    // VBOをバインドし登録する関数
    function set_attribute(vbo, attL, attS){
        // 引数として受け取った配列を処理する
        for(let i in vbo){
            // WebGLにVBOをバインド
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo[i]);

            // attribute属性を有効にする
            gl.enableVertexAttribArray(attL[i]);

            // attribute属性を登録、VBOからシェーダにデータを渡す
            gl.vertexAttribPointer(attL[i], attS[i], gl.FLOAT, false, 0, 0);
        }
    }

    // IBOを生成する関数
    function create_ibo(data){
        // バッファオブジェクトの生成
        const ibo = gl.createBuffer();

        // バッファをバインドする
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);

        // バッファにデータをセット
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);

        // バッファのバインドを無効化
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        // 生成したIBOを返して終了
        return ibo;
    }

    // トーラスのモデルデータを生成する関数
    function torus(row, column, irad, orad, color){
        let pos = new Array();
        let nor = new Array();
        let col = new Array(); 
        let idx = new Array();
        for(let i = 0; i <= row; i++)
        {
            // 輪を作る
            const r = 2 * Math.PI  * i / row; // 半径1の円のラジアン
            const rr = Math.cos(r);           // x座標
            const ry = Math.sin(r);           // y座標
            for(let ii = 0; ii <= column; ii++)
            {
                // 管を作る
                const tr = 2 * Math.PI * ii / column;
                const tx = (rr * irad + orad) * Math.cos(tr);
                const ty = ry * irad;
                const tz = (rr * irad + orad) * Math.sin(tr);
                const rx = rr * Math.cos(tr);       // 頂点Aの法線は、トーラスを頂点Aを含むよう輪切りし、
                const rz = rr * Math.sin(tr);       // その中心を原点とした時の、頂点Aの座標に一致するからこの計算で良い。
                if(color)
                {
                    var tc = color;
                }
                else
                {
                    tc = hsva(360 / column * ii, 1, 1, 1);
                }
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(tc[0], tc[1], tc[2], tc[3]); 
            }
        }
        for(i = 0; i < row; i++)
        {
            for(ii = 0; ii < column; ii++)
            {
                r = (column + 1) * i + ii;
                idx.push(r, r + column + 1, r + 1);
                idx.push(r + column + 1, r + column + 2, r + 1);
            }
        }
        return {position: pos, normal: nor, color: col, index: idx};
    }

    function hsva(h, s, v, a){
        if(s > 1 || v > 1 || a > 1){return;}
        const th = h % 360;
        const i = Math.floor(th / 60);
        const f = th / 60 - i;
        const m = v * (1 - s);
        const n = v * (1 - s * f);
        const k = v * (1 - s * (1 - f));
        const color = new Array();
        if(!s > 0 && !s < 0){
            color.push(v, v, v, a); 
        } else {
            const r = new Array(v, n, m, m, k, v);
            const g = new Array(k, v, v, n, m, m);
            const b = new Array(m, m, k, v, v, n);
            color.push(r[i], g[i], b[i], a);
        }
        return color;
    }

    // 縞模様の球体を自作
    function stripedSphere(radius, frequency, roundness)
    {
        const pos = new Array();
        const nor = new Array();
        const col = new Array();
        const idx = new Array();
        for(let i = 1; i < frequency; i++)
        {
            const y_ratio = parseFloat(i) / frequency;  // 0<y_ration<1をとるy座標
            const y = 2.0 * radius * y_ratio;           // 0<y<2radius
            const y_radius = Math.sqrt(radius * radius - (radius - y) * (radius - y));
            for(let ii = 0; ii <= roundness; ii++)
            {
                const circle = 2 * Math.PI * ii / roundness;
                const tx = y_radius * Math.cos(circle);
                const ty = y - radius;
                const tz = y_radius * Math.sin(circle);
                pos.push(tx, ty, tz);
                nor.push(tx, ty, tz);  // このモデルは球だから、法線はこれで良い
                const tc = hsva(360 / roundness * ii, 1, 1, 1);
                col.push(tc[0], tc[1], tc[2], tc[3]);
            }
        }
        
        for(let i = 0; i < (frequency) / 2; i++)
        {
            for(let ii = 0; ii < roundness; ii++)
            {
                r = ii + 2 * i * (roundness + 1);
                idx.push(r, r + roundness + 1, r + roundness + 2);
                idx.push(r, r + roundness + 2, r + 1);    
            }
        }
        return {position: pos, normal: nor, color: col, index: idx};

    }

    // 球体を生成する関数
    function sphere(row, column, rad, color){
        let pos = new Array(), nor = new Array(),
            col = new Array(), idx = new Array();
        for(let i = 0; i <= row; i++){
            const r = Math.PI / row * i;
            const ry = Math.cos(r);
            const rr = Math.sin(r);
            for(let ii = 0; ii <= column; ii++){
                const tr = Math.PI * 2 / column * ii;
                const tx = rr * rad * Math.cos(tr);
                const ty = ry * rad;
                const tz = rr * rad * Math.sin(tr);
                const rx = rr * Math.cos(tr);
                const rz = rr * Math.sin(tr);
                if(color){
                    var tc = color;
                }else{
                    tc = hsva(360 / row * i, 1, 1, 1);
                }
                pos.push(tx, ty, tz);
                nor.push(rx, ry, rz);
                col.push(tc[0], tc[1], tc[2], tc[3]);
            }
        }
        r = 0;
        for(i = 0; i < row; i++){
            for(ii = 0; ii < column; ii++){
                r = (column + 1) * i + ii;
                idx.push(r, r + 1, r + column + 2);
                idx.push(r, r + column + 2, r + column + 1);
            }
        }
        return {position : pos, normal : nor, color : col, index : idx};
    }

    // イメージオブジェクトを作成し、ソースを割り当て
    // 割り当て後、テクスチャオブジェクトとイメージを結びつける
    function create_texture(source, number){
        // イメージオブジェクトの生成
        const img = new Image();

        // データのオンロードをトリガーにする
        img.onload = function(){
            // テクスチャオブジェクトの生成
            const tex = gl.createTexture();

            // テクスチャをバインドする
            gl.bindTexture(gl.TEXTURE_2D, tex);

            // テクスチャへイメージを適用
            // これが呼び出されるまでに画像imgが読み込まれている必要があるため、
            // イメージオブジェクトで画像が読み込まれたら発火するイベントImage.onloadに追加
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            // ミップマップを生成
            gl.generateMipmap(gl.TEXTURE_2D);

            // テクスチャのバインドを無効化
            gl.bindTexture(gl.TEXTURE_2D, null);

            // 生成したテクスチャをグローバル変数に代入
            texture = tex;

            // 生成したテクスチャを変数に代入
            switch(number){
                case 0:
                    texture0 = tex;
                    break;
                case 1:
                    texture1 = tex;
                    break;
                default:
                    break;
            }
        }

        // イメージオブジェクトのソースを指定
        img.src = source;
    }

    // ブレンドタイプを設定する関数
    function blend_type(prm){
        switch(prm){
            // 透過処理
            case 0:
                //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
                break;
            // 加算合成
            case 1:
                //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
                break;
            default:
                break;
        }
    }
});