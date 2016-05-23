(function() {
    function getJSON(url, successHandler, errorHandler) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = 'json';
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    successHandler(xhr.response);
                } else {
                    errorHandler(xhr.status);
                }
            }
        };
        xhr.send();
    }

    function sendJSON(data) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/submit", true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.send(data);
    }

    var tree,
        body = document.body,
        mainContainer = document.getElementById('container'),
        rootTree = mainContainer.querySelector('.rootTree');
    /*
    Delegating events of nested items to rootTree element 
    */
    rootTree.addEventListener('click', classToggle);
    rootTree.addEventListener('contextmenu', buildContextMenuContainer);    

    /*
    Sending get-request to receive  array of companies
    */
    getJSON("/tree.json", function(data) {
        tree = applyIds(data, null);
        buildTree(rootTree, tree);
    }, function(status) {
        alert('Something went wrong.');
    });

    /*
    Applying ids. Nested items got ids like "0_1_0" that 
    corresponds to the path to item: tree[0].tree[1].tree[0]
    */
    function applyIds(data, index) {
        data.forEach(function(v, i) {
            if (index !== null) {
                v.id = index + '_' + i;
            } else {
                v.id = i;
            }
            var parentId = v.id;

            if (v.tree) {
                applyIds(v.tree, parentId);
            }
        });
        return data;
    }

    /*
    Building tree and appending it to the DOM with recursive function call
    for nested items.
    */
    function buildTree(parent, arr) {
        for (var i = 0; i < arr.length; i++) {

            var li = document.createElement("li");
            var sum = arr[i].tree ? (" | " + "<b>" +(findSum(arr[i].tree) + (+arr[i].earn)) + "</b>" +"K$") : '';
            li.innerHTML = "<span>" + arr[i].companyName + " " + arr[i].earn +"K$"+ sum + "</span>";
            li.dataset.id = arr[i].id; // setting item's id to data-id attribute 

            parent.appendChild(li);
            var subTree = parent.lastChild;

            if (arr[i].tree && arr[i].tree.length > 0) {
                subTree.className = arr[i].treeClass || "inactive";
                var ul = document.createElement("ul");
                subTree.appendChild(ul);
                var subsubTree = subTree.getElementsByTagName("ul")[0];
                buildTree(subsubTree, arr[i].tree);
            }
        }
    }

    function findSum(subTree) {
        var sum = 0;
        for (var i = 0; i < subTree.length; i++) {
            if (subTree[i].tree && subTree[i].tree.length > 0) {
                sum += findSum(subTree[i].tree);
            }
            sum += +subTree[i].earn;
        }
        return sum;
    }

    function removeContainer(parent, child) {
        if (child) {
            parent.removeChild(child);
        }
    }    

    function buildContextMenuContainer(e) {
        removeContainer(body, document.getElementsByClassName("contextMenuContainer")[0]);
        removeContainer(mainContainer, document.getElementsByClassName("formContainer")[0]);

        var target;
        if (e.target.tagName === "SPAN") {
            e.preventDefault();
            target = e.target;
            target.className += "selected";
        } else return;

        var clickedItmeId = target.parentNode.dataset.id;

        var contextMenu = document.createElement("div");
        contextMenu.className = "contextMenuContainer";

        var addItem = document.createElement("div");
        addItem.innerHTML = "Add Company";

        var edit = document.createElement("div");
        edit.innerHTML = "Edit";

        contextMenu.appendChild(addItem);
        contextMenu.appendChild(edit);
        body.appendChild(contextMenu);

        contextMenu.style.position = "absolute";
        contextMenu.style.left = e.clientX + "px";
        contextMenu.style.top = e.clientY  + "px";

        addItem.addEventListener("click", function() {
            addCompany(clickedItmeId);
        });

        edit.addEventListener("click", function() {
            editCompany(clickedItmeId);
        });
    }

    /*
    Hiding ContextMenu
    */
    body.addEventListener("click", function() {
        removeContainer(body, document.getElementsByClassName("contextMenuContainer")[0]);
        if (document.querySelector(".selected")) {
            document.querySelector(".selected").className = "";
        }
    });

    function addCompany(clickedItmeId) {
        buildInputContainer();
        var form = container.querySelector("form"),
            input = container.querySelector("input[type='text']"),
            earningsInput = container.querySelector("input[type='number']");
        input.focus();
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            updateTreeArr([clickedItmeId, input.value, earningsInput.value]);
            rebuildTree();
        }); 
    }

    function editCompany(clickedItmeId) {
        buildInputContainer();
        var form = container.querySelector("form"),
            input = container.querySelector("input[type='text']"),
            earningsInput = container.querySelector("input[type='number']"),
            item = findElem(clickedItmeId);
        input.focus();
        input.value = item.companyName;
        earningsInput.value = item.earn;
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            item.companyName = input.value;
            item.earn = earningsInput.value;
            rebuildTree();
        });
    }

    /*
    Building form for input
    */
    function buildInputContainer(clickedItmeId) {
        removeContainer(body, document.getElementsByClassName("contextMenuContainer")[0]);

        var form = document.createElement("form");
        form.className = "formContainer";
        form.innerHTML = "<ul><li><label>Company name </label>" +
            "<input type='text' class='field' placeholder='required field' required/>" +
            "</li><li>" +
            "<label>Estimated Earnings, K$ </label>" +
            "<input type='number' class='field' placeholder='required field' required/>" +
            "</li><li>" +
            "<button>Cancel</button><input type='submit' value='Submit' />" +
            "</li></ul>";

        container.appendChild(form);
        var cancel = container.querySelector("button");
        cancel.addEventListener("click", function(e) {
            removeContainer(container, form);
        });
    }

    /*
    Handler that switches css classes and updates object's class value,
    so a state of tree will not change after page refresh.
    */
    function classToggle(e) {
        var target;

        if (e.target.tagName === "LI" && e.target.lastElementChild && e.target.lastElementChild.tagName === "UL") {
            target = e.target;
        } else if (e.target.tagName === "SPAN" && e.target.parentNode.tagName === "LI" &&
                    e.target.parentNode.lastElementChild.tagName === "UL") {
            target = e.target.parentNode;
        } else return;

        target.className = target.className === "active" ? "inactive" : "active";

        var item = findElem(target.dataset.id);
        item.treeClass = target.className;
        sendJSON(JSON.stringify(tree));
    }

    /* Finding destnation object */
    function findElem(idData) {
        var item;
        var ids = idData.split("_");
        item = tree[ids[0]];
        for (var i = 1; i < ids.length; i++) {
            item = item.tree[ids[i]];
        }
        return item;       
    }

    /*
    Adding new item into tree array.
    */
    function updateTreeArr(valueArr) {
        var item = findElem(valueArr[0]);

        if (item.tree) {
            var len = item.tree.length;
            item.tree[len] = { companyName: valueArr[1], earn: valueArr[2], treeClass: "inactive" };
        } else {
            item.tree = [{ companyName: valueArr[1], earn: valueArr[2], treeClass: "inactive" }];
        }
        item.treeClass = "active";        
    }

    function rebuildTree() {
        removeContainer(container, document.getElementsByClassName("formContainer")[0]);

        if (rootTree.hasChildNodes()) { // removing old tree
            while (rootTree.firstChild) {
                removeContainer(rootTree, rootTree.firstChild);
            }
        }
        applyIds(tree, null); // applying data-id to updated tree
        buildTree(rootTree, tree); // rebuilding tree
        
        sendJSON(JSON.stringify(tree));
    }
})();