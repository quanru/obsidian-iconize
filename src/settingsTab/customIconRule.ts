import { App, Notice, Setting, TextComponent } from 'obsidian';
import IconFolderSetting from './iconFolderSetting';
import { ColorPickerComponent } from '../colorPickerComponent';
import IconsPickerModal from '../iconsPickerModal';
import IconFolderPlugin from '../main';
import { addCustomRuleIconsToDOM, colorizeCustomRuleIcons, removeCustomRuleIconsFromDOM } from '../util';

export default class CustomIconRuleSetting extends IconFolderSetting {
  private app: App;
  private textComponent: TextComponent;

  constructor(plugin: IconFolderPlugin, containerEl: HTMLElement, app: App) {
    super(plugin, containerEl);
    this.app = app;
  }

  public display(): void {
    new Setting(this.containerEl)
      .setName('Add icon rule')
      .setDesc('Will add the icon based on the specific string.')
      .addText((text) => {
        text.setPlaceholder('regex or simple string');
        this.textComponent = text;
      })
      .addButton((btn) => {
        btn.setButtonText('Choose icon');
        btn.buttonEl.style.marginLeft = '12px';
        btn.onClick(async () => {
          if (this.textComponent.getValue().length === 0) {
            return;
          }

          const modal = new IconsPickerModal(this.app, this.plugin, '');
          modal.onChooseItem = async (item) => {
            let icon = '';
            if (typeof item === 'object') {
              icon = item.displayName;
            } else {
              icon = item;
            }

            const rule = { rule: this.textComponent.getValue(), icon };
            this.plugin.getSettings().rules = [...this.plugin.getSettings().rules, rule];
            await this.plugin.saveIconFolderData();

            this.display();
            new Notice('Icon rule added.');
            this.textComponent.setValue('');

            addCustomRuleIconsToDOM(this.plugin, rule);
          };
          modal.open();
        });
      });

    this.plugin.getSettings().rules.forEach((rule) => {
      const settingRuleEl = new Setting(this.containerEl).setName(rule.rule).setDesc(`Icon: ${rule.icon}`);

      const colorPicker = new ColorPickerComponent(settingRuleEl.controlEl)
        .setValue(rule.color ?? '#000000')
        .onChange(async (value) => {
          rule.color = value;
          await this.plugin.saveIconFolderData();

          colorizeCustomRuleIcons(this.plugin, rule);
        });
      settingRuleEl.components.push(colorPicker);

      settingRuleEl.addButton((btn) => {
        btn.setIcon('trash');
        btn.setTooltip('Remove the custom rule');
        btn.onClick(async () => {
          const newRules = this.plugin.getSettings().rules.filter((r) => rule.rule !== r.rule);
          this.plugin.getSettings().rules = newRules;
          await this.plugin.saveIconFolderData();

          this.display();
          new Notice('Custom rule deleted.');

          removeCustomRuleIconsFromDOM(this.plugin, rule);
        });
      });
    });
  }
}
