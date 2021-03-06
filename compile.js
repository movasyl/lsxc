// Generated by LiveScript 1.5.0
(function(){
  var fs, through, reactify, browserifyInc, livescript, browserify, xtend, sassc, watch, fixIndents, ref$, red, yellow, gray, green, basedir, baseTitle, title, error, save, setupWatch, compileFile, compile;
  fs = require('fs');
  through = require('through');
  reactify = require('reactify-ls');
  browserifyInc = require('browserify-incremental');
  livescript = require('livescript');
  browserify = require('browserify');
  xtend = require('xtend');
  sassc = require('node-sass');
  watch = require('node-watch');
  fixIndents = require('fix-indents');
  ref$ = require('chalk'), red = ref$.red, yellow = ref$.yellow, gray = ref$.gray, green = ref$.green;
  basedir = process.cwd();
  baseTitle = curry$(function(colored, symbol, text){
    var max;
    text = "[" + colored(symbol) + "] " + colored(text);
    max = 40 - text.length;
    if (max <= 0) {
      return text;
    } else {
      return text + (function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = max; i$ <= to$; ++i$) {
          results$.push(i$);
        }
        return results$;
      }()).map(function(){
        return " ";
      }).join('');
    }
  });
  title = baseTitle(green, "✓");
  error = baseTitle(red, "x");
  save = function(file, content){
    console.log(title('save') + " " + file);
    return fs.writeFileSync(file, content);
  };
  setupWatch = function(commander){
    var watcher;
    return watcher = watch(basedir, {
      recursive: true,
      filter: function(name){
        return !/(node_modules|\.git)/.test(name) && /\.ls/.test(name);
      }
    }, function(){
      watcher.close();
      return compile(commander);
    });
  };
  compileFile = function(input, data){
    var code, state, err, errorline, ref$, lines, index;
    console.log(title('compile') + " " + input);
    code = reactify(data);
    state = {
      js: null
    };
    try {
      state.js = livescript.compile(code.ls);
    } catch (e$) {
      err = e$;
      state.err = err.message;
      errorline = (ref$ = err.message.match(/line ([0-9]+)/)[1]) != null ? ref$ : 0;
      lines = code.ls.split('\n');
      for (index in lines) {
        if (index === errorline) {
          lines[index] = lines[index] + ("       <<< " + red(err.message));
        } else {
          lines[index] = gray(lines[index]);
        }
      }
      console.error(([].concat(lines)).join('\n'));
    }
    return {
      ls: code.ls,
      sass: code.sass,
      js: state.js,
      err: state.err
    };
  };
  compile = function(commander){
    var file, sassCache, path, sassC, filename, bundle, bundleJs, bundleCss, html, bundleHtml, sass, compilesass, ref$, makeBundle, print;
    console.log("----------------------");
    file = commander.compile;
    sassCache = (path = "./." + file + ".sass.cache", {
      save: function(obj){
        return fs.writeFileSync(path, JSON.stringify(obj));
      },
      load: function(){
        if (!fs.existsSync(path)) {
          return {};
        }
        return JSON.parse(fs.readFileSync(path).toString('utf8'));
      }
    });
    sassC = sassCache.load();
    filename = file.replace(/\.ls/, '');
    if (file == null) {
      return console.error('File is required');
    }
    bundle = commander.bundle === true
      ? 'bundle'
      : commander.bundle;
    bundleJs = "." + filename + "-" + bundle + ".js";
    bundleCss = "." + filename + "-" + bundle + ".css";
    html = commander.html === true
      ? 'index'
      : commander.html;
    bundleHtml = "." + filename + "-" + html + ".html";
    sass = commander.sass === true
      ? 'style'
      : commander.sass;
    compilesass = commander.compilesass === true
      ? 'style'
      : commander.compilesass;
    sassC[commander.compile] = (ref$ = sassC[commander.compile]) != null
      ? ref$
      : {};
    makeBundle = function(file, callback){
      var options, b, bundle, string;
      console.log(title('make bundle') + " " + file);
      options = {
        basedir: basedir,
        paths: [basedir + "/node_modules"],
        debug: false,
        commondir: false,
        entries: [file]
      };
      b = browserify(xtend(browserifyInc.args, options));
      b.transform(function(file){
        var filename, data, write, end;
        filename = file.match(/([a-z-0-9]+)\.ls$/)[1];
        console.log(title('process') + " " + file);
        data = '';
        write = function(buf){
          return data += buf;
        };
        end = function(){
          var code, indented, sassConf, err;
          code = compileFile(file, data);
          if (sass != null) {
            save("." + filename + ".sass", code.sass);
          }
          if (commander.fixindents) {
            indented = fixIndents(data);
            if (data !== indented) {
              console.log(title('fix indents') + " " + file);
              save(file, indented);
            }
          }
          if (compilesass != null) {
            console.log(title('compile') + " ." + filename + ".sass");
            if (code.sass.length > 0) {
              sassConf = {
                data: code.sass,
                indentedSyntax: true
              };
              try {
                sassC[commander.compile][file] = sassc.renderSync(sassConf).css.toString('utf8');
              } catch (e$) {
                err = e$;
                console.error(error('err compile sass') + "  " + yellow(err.message));
              }
            } else {
              sassC[commander.compile][file] = "";
            }
          }
          this.queue(code.js);
          return this.queue(null);
        };
        return through(write, end);
      });
      browserifyInc(b, {
        cacheFile: "." + file + ".cache"
      });
      bundle = b.bundle();
      string = "";
      bundle.on('data', function(data){
        return string += data.toString();
      });
      bundle.on('error', function(error){
        return console.error(error('bundle error') + " " + error.message);
      });
      return bundle.on('end', function(_){
        var compiledSass, result;
        compiledSass = sassC[commander.compile];
        result = {
          css: Object.keys(compiledSass).map(function(it){
            return compiledSass[it];
          }).join('\n'),
          js: string
        };
        sassCache.save(sassC);
        callback(null, result);
      });
    };
    if (commander.bundle != null) {
      makeBundle(file, function(err, bundlec){
        save(bundleJs, bundlec.js);
        if (compilesass != null) {
          save(bundleCss, bundlec.css);
        }
      });
    }
    if (commander.html != null) {
      print = "<!DOCTYPE html>\n<html lang=\"en-us\">\n  <head>\n   <meta charset=\"utf-8\">\n   <title>Hello...</title>\n   <link rel=\"stylesheet\" type=\"text/css\" href=\"./" + bundleCss + "\">\n  </head>\n  <script type=\"text/javascript\" src=\"./" + bundleJs + "\"></script>\n</html>";
      save(bundleHtml, print);
    }
    if (commander.watch) {
      console.log(title("watcher started..."));
      return setupWatch(commander);
    }
  };
  module.exports = compile;
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);
