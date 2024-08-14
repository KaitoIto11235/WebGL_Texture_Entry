document.addEventListener('DOMContentLoaded', function () {
    // HTMLからcanvas要素を取得する
    const canvas = document.getElementById('canvas');
    canvas.width = 1260;
    canvas.height = 520;

    // canvas要素からwebglコンテキストを取得する
    const gl = canvas.getContext('webgl');
    // WebGLコンテキストが取得できたかどうか調べる
    if (!gl) {
        alert('webgl not supported!');
        return;
    }
    // canvasを初期化する色を設定する
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    // canvasを初期化する際の深度を設定する
    gl.clearDepth(1.0);
    // canvasを初期化する
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 頂点シェーダとフラグメントシェーダの生成
    const v_shader = create_shader('vertexShader');
    const f_shader = create_shader('fragmentShader');
    
    // プログラムオブジェクトの生成とリンク
    const prg = create_program(v_shader, f_shader);
    
    let attLocation = new Array(2);
    // attributeLocationの取得、positionが何番目のAttributeかを返す
    attLocation[0] = gl.getAttribLocation(prg, 'position');
    attLocation[1] = gl.getAttribLocation(prg, 'normal');
    attLocation[2] = gl.getAttribLocation(prg, 'color');
    
    
    const attStride = new Array(2);
    // attribute1の要素数(この場合は xyz の3要素)
    attStride[0] = 3;
    attStride[1] = 3;
    attStride[2] = 4;
    
    
    const torusData = torus(32, 32, 1.0, 5.0);
    //const stripedSphereData = stripedSphere(2, 51, 20);
    const sphereData = sphere(64, 64, 2.0, [0.5, 0.0, 0.5, 0.2]);

    // VBOの生成
    const tPosition_vbo = create_vbo(torusData.position);
    const tNormal_vbo = create_vbo(torusData.normal);
    const tColor_vbo = create_vbo(torusData.color);
    const tVBOList = [tPosition_vbo, tNormal_vbo, tColor_vbo];
    // VBOの生成
    const sPosition_vbo = create_vbo(sphereData.position);
    const sNormal_vbo = create_vbo(sphereData.normal);
    const sColor_vbo = create_vbo(sphereData.color);
    const sVBOList = [sPosition_vbo, sNormal_vbo, sColor_vbo];

    

    // IBOの生成
    const tIBOIndex = create_ibo(torusData.index);
    const sIBOIndex = create_ibo(sphereData.index);


    let uniLocation = new Array();
    // uniformLocationの取得　prgオブジェクトにあるシェーダのuniform変数’mvpMatrix’がuniform変数の中で何番目のものかを取得
    uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
    uniLocation[1] = gl.getUniformLocation(prg, 'mMatrix');
    uniLocation[2] = gl.getUniformLocation(prg, 'invMatrix');
    uniLocation[3] = gl.getUniformLocation(prg, 'lightPosition1');
    uniLocation[4] = gl.getUniformLocation(prg, 'lightPosition2');
    uniLocation[5] = gl.getUniformLocation(prg, 'eyeDirection');
    uniLocation[6] = gl.getUniformLocation(prg, 'ambientColor');

    // minMatrix.js を用いた行列関連処理
    // matIVオブジェクトを生成
    let m = new matIV();
    
    // 各種行列の生成と初期化
    let mMatrix = m.identity(m.create());
    let vMatrix = m.identity(m.create());
    let pMatrix = m.identity(m.create());
    let tmpMatrix = m.identity(m.create());
    let mvpMatrix = m.identity(m.create());
    let invMatrix = m.identity(m.create());
    
    // ビュー座標変換行列
    m.lookAt([0.0, 0.0, 20.0], [0, 0, 0], [0, 1, 0], vMatrix);
    // プロジェクション座標変換行列
    m.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix);
    // ビュー×プロジェクション座標変換行列を完成させる
    m.multiply(pMatrix, vMatrix, tmpMatrix);

    // 平行光源の向き
    const lightDirection = [-0.5, 0.5, 0.5];
    // 点光源の位置
    //const lightPosition1 = [5.0, 5.0, 2.0];
    //const lightPosition2 = [-8.0, 0.0, 9.0];
    // 視線ベクトル
    const eyeDirection = [0.0, 0.0, 20.0];
    // 乱反射によって空間全てを少しだけ照らす環境光
    const ambientColor = [0.1, 0.1, 0.1, 0.1];

    // カリングを有効に
    gl.enable(gl.CULL_FACE);
    // 深度テストを有効に
    gl.enable(gl.DEPTH_TEST);
    // 深度テストの評価方法の指定
    gl.depthFunc(gl.LEQUAL);
    

    // カウンタの宣言
    let count = 0;

    // 恒常ループ
    (function(){
        // canvasを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        count++;

        // カウンタを元にラジアンと各種座標を算出
        const rad = (count % 360) * Math.PI / 180;
        const tx = Math.cos(rad) * 5;
        const ty = Math.sin(rad) * 5;
        const tz = Math.sin(rad) * 5;

        const lightPosition1 = [tx, -ty, -tz];
        const lightPosition2 = [-tx, ty, tz];

        // トーラスのVBOとIBOをセット
        set_attribute(tVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIBOIndex);

        m.identity(mMatrix);
        m.translate(mMatrix, [tx, -ty, -tz], mMatrix);
        m.rotate(mMatrix, -rad, [0, 1, 1], mMatrix);
        // モデル座標変換行列から逆行列を生成
        m.inverse(mMatrix, invMatrix);

        // モデル1の座標変換行列を完成させレンダリングする
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);
        // フラグメントシェーダのuniformLocationへ座標変換行列を登録する（一つ目のモデル）
        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
        gl.uniform3fv(uniLocation[3], lightPosition1);
        gl.uniform3fv(uniLocation[4], lightPosition2);
        gl.uniform3fv(uniLocation[5], eyeDirection);
        gl.uniform4fv(uniLocation[6], ambientColor);
        gl.drawElements(gl.TRIANGLES, torusData.index.length, gl.UNSIGNED_SHORT, 0);

        // トーラスのVBOとIBOをセット
        set_attribute(sVBOList, attLocation, attStride);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sIBOIndex);
        
        // モデル2はY軸を中心に回転する
        m.identity(mMatrix);
        m.translate(mMatrix, [-tx, ty, tz], mMatrix);
        // モデル座標変換行列から逆行列を生成
        m.inverse(mMatrix, invMatrix);
        // モデル2の座標変換行列を完成させレンダリングする
        m.multiply(tmpMatrix, mMatrix, mvpMatrix);

        gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
        gl.uniformMatrix4fv(uniLocation[1], false, mMatrix);
        gl.uniformMatrix4fv(uniLocation[2], false, invMatrix);
        gl.drawElements(gl.TRIANGLES, sphereData.index.length, gl.UNSIGNED_SHORT, 0);


        // コンテキストの再描画
        gl.flush();
        
        // ループのために再帰呼び出し
        setTimeout(arguments.callee, 1000 / 100);
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
});