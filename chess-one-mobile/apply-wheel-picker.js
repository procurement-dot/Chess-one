const fs = require('fs');
let c = fs.readFileSync('src/app/play/create.tsx', 'utf8');

if (!c.includes('CustomWheelPicker')) {
  c = c.replace(
    /import \{ AppFooter \} from '\.\.\/\.\.\/components\/navigation\/AppFooter';/,
    "import { AppFooter } from '../../components/navigation/AppFooter';\nimport { CustomWheelPicker } from '../../components/ui/CustomWheelPicker';"
  );
}

// Generate the new JSX
const newTimeControlsJSX = `
        {/* Time Control Section */}
        <Text style={styles.sectionTitle}>Time Control</Text>
        <View style={{ flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, marginVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <CustomWheelPicker
            items={Array.from({length: 60}, (_, i) => ({ label: String(i + 1).padStart(2, '0'), value: String(i + 1) }))}
            selectedValue={timeControl.split('+')[0]}
            onValueChange={(val) => setTimeControl(val + '+' + timeControl.split('+')[1])}
            suffix="M"
          />
          <CustomWheelPicker
            items={Array.from({length: 60}, (_, i) => ({ label: String(i).padStart(2, '0'), value: String(i) }))}
            selectedValue={timeControl.split('+')[1] || '0'}
            onValueChange={(val) => setTimeControl(timeControl.split('+')[0] + '+' + val)}
            suffix="S"
          />
        </View>
`;

c = c.replace(/\{\/\* Time Control Section \*\/\}[\s\S]*?<\/ScrollView>/, newTimeControlsJSX.trim());

fs.writeFileSync('src/app/play/create.tsx', c);
