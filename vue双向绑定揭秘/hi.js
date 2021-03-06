//  Dep
function Dep() {
	this.subs = [];
}
Dep.prototype = {
	addSub: function(sub) {
		this.subs.push(sub);
	},
	notify: function() {
		this.subs.forEach(function(sub) {
			sub.update();
		});
	}
};

// watcher
function Watcher(vm, node, name, nodeType) {
	Dep.target = this;
	this.name = name;
	this.node = node;
	this.vm = vm;
	this.nodeType = nodeType;
	this.update();
	Dep.target = null;
}
Watcher.prototype = {
	update: function() {
		this.get();
		if (this.nodeType == 'input') {
			this.node.value = this.value;
		}
		if (this.nodeType == 'text') {
			this.node.nodeValue = this.value;
		}
		if (this.nodeType == 'element') {
			this.node.innerHTML = this.value;
		}
	},
	get: function() { //获取data中的值
		this.value = this.vm[this.name];
	}
};

function compile(node, vm) {
	var reg = /\{\{(.*)\}\}/;

	var attr = node.attributes;
	//节点类型是 元素
	if (node.nodeType == 1) {
		if (node.innerHTML) { //处理 <h3>{{text}}</h3>
			var nodeHtml = node.innerHTML;
			if (reg.test(nodeHtml)) {
				var name = RegExp.$1; //获取到匹配到的字符串
				name = name.trim();
				//node.nodeValue=vm[name]; //把data的值赋给该node

				new Watcher(vm, node, name, 'element');
			}
			//给元素添加事件
			for (var i = 0; i < attr.length; i++) {
				let nodeName = attr[i].nodeName;
				let nodeValue = attr[i].nodeValue;
				if (nodeName.startsWith('v-on:') || nodeName.startsWith('@')) {
					let reg = /:|@/g;
					let eventName = nodeName.split(reg)[1];

					node.addEventListener(eventName, function() {
						//console.log(vm,nodeValue);

						vm[nodeValue]();
					}, false);
				}
			}
		} else {
			//解析属性
			for (var i = 0; i < attr.length; i++) {
				if (attr[i].nodeName == 'v-model') {
					var name = attr[i].nodeValue; //获取 v-model绑定的属性名

					node.addEventListener('input', function(ev) {
						vm[name] = ev.target.value;
					}, false);
					node.value = vm[name]; //把data的值赋给该node
					//new Watcher(vm,node,name);
					node.removeAttribute('v-model');
				}
			}

			new Watcher(vm, node, name, 'input');
		}
	}

	//节点类型是 text
	if (node.nodeType == 3) {

		if (reg.test(node.nodeValue)) {
			var name = RegExp.$1; //获取到匹配到的字符串
			name = name.trim();
			//node.nodeValue=vm[name]; //把data的值赋给该node

			new Watcher(vm, node, name, 'text');
		}
	}
}

function nodeToFragment(node, vm) {
	var frag = document.createDocumentFragment();
	var child;
	while (child = node.firstChild) {
		compile(child, vm);
		frag.appendChild(child);
	}

	return frag;
}

//根据 input的值，更新view
function defineReactvie(obj, key, val) {
	var dep = new Dep();
	Object.defineProperty(obj, key, {
		get: function() {
			if (Dep.target) dep.addSub(Dep.target);
			return val;
		},
		set: function(newVal) {
			if (newVal == val) return;
			val = newVal;
			//console.log(newVal);

			dep.notify();
		}
	});
}

function observe(data, vm) {
	Object.keys(data).forEach(function(key) {
		defineReactvie(vm, key, data[key]);
	});
}

function Vue(options) {
	this.data = options.data;
	this.methods = options.methods;

	var data = this.data;
	var methods = this.methods;

	observe(data, this);
	observe(methods, this);

	var id = options.el;
	var dom = nodeToFragment(document.querySelector(id), this);

	//fragment 完事之后渲染到 dom，app中
	document.querySelector(id).appendChild(dom);
}