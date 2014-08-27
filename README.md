Firefox Profile Manager: /Applications/Firefox.app/Contents/MacOS/firefox-bin -ProfileManager 

Open your terminal, navigate to the Firefox Add-on SDK folder (/Applications/Entwicklung/Mozilla/addon-sdk-1.15/) and run source bin/activate which will launch a virtual environment in your terminal

Then, navigate to %REPOSITORY%/extension and run cfx run to launch Firefox with the extension
To build run cfx xpi







      <nav id="menu">
        <div id="goals">
          <ul data-bind="foreach: goals">
            <li data-bind="attr: { id: idAsString }">
              <a href="#" data-bind="click: $parent.selectGoal"><span data-bind="text: title"></span></a>
            </li>
          </ul>
        </div>
      </nav>