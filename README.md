<h2>Introduction</h2>
This is TasksTodo, a Firefox add-on to support task-based information retrieval and search on the web. TasksTodo is an academic project. Find out more at our website taskstodo.org.

The integrated task tool will enable you to structure the goals at hand into tasks and sub-task and use this explicit information as important part of the users’ current context. Given a task is selected, all implicit and explicit user interaction over several sessions is stored with reference to this task.

<h3>Download and try out!</h3>
Try it out and download the taskstodo_sidebar.xpi to install it to your Firefox web browser. Within the tool you have the possibility to register and log-in into your account. This service is absolutely free.

<h2>FEATURES</h2>

<h3>Direct integration into the web browser</h3>
TasksTodo is directly integrated into the web browser (currently only Firefox). This way it can support you during your search and other web activities.

<h3>Multi-level management of goals and tasks</h3>
Manage your multiple goals and corresponding tasks in one simple tool directly in your favorite web browser. Add as many goals or tasks as you like and structure your tasks by hierarchy by simply indenting sub-tasks. You can also order your entries using the integrated drag and drop functionality.

<h3>Manage your task related notes</h3>
Simply store notes to your tasks. You can either explicitly add notes by using the provided TasksTodo form or by selecting any text on a web page and using the context menu item "Save text selection as a note to my current task".

<h3>Manage your task related bookmarks</h3>
Simply add bookmarks to your tasks using TaskTodo by filling out the form or using the integrated browser options in the context menu. For the latter one you can just right click in the browser window and select the option "Add this page as a bookmark to my current task". Bookmarked pages are indicated by showing a green banner. This banner is shown when you visit the page and you selected the task. It helps you to identify directly your task-related bookmarks.

<h3>Manage your task related attachments</h3>
Simply add files to your tasks.

<h3>Review your task related history</h3>
To simplify resuming interrupted tasks, TasksTodo tracks all your browser activities and assigns these information to the selected tasks. This allows you to recapture your latest activities during task processing. You can manage all this information yourself and you can also delete single activities.

<h3>Execute past queries</h3>
TasksTodo tracks all your search queries for engines like Google, Bing, Yahoo, Wikipedia and many more. When a certain task is selected, TasksTodo shows a small window with your latest five queries regarding the currently visiting search engine. This way you can easily re-execute your previous searches.

-----

<h2>Enhancing and Devopment</h2>

For developing and enhancing TasksTodo the following will be interesting for you.

Firefox Profile Manager: /Applications/Firefox.app/Contents/MacOS/firefox-bin -ProfileManager 

1) Navigate to the extension work directory (e.g. cd ~/Workspace/FernUni/TasksTodo/TasksTodoFirefox/)
2) Run "jpm run -v" to start a Firefox window with the installed app (in verbose mode) or "jpm run --debug -v" (in debug mode)
3) Run "jpm xpi" to greate a XPI file
4) Sign the application using "jpm sign --api-key ${AMO_API_KEY} --api-secret ${AMO_API_SECRET}". This submits an XPI it to the addons.mozilla.org signing API, then downloads a signed XPI to the working directory if it passes validation.