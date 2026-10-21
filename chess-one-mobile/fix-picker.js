const fs = require('fs');
let c = fs.readFileSync('src/app/play/create.tsx', 'utf8');

const replacement = `
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}
          snapToInterval={112}
          decelerationRate="fast"
          style={{ marginHorizontal: -16 }} // Bleed to edges
        >
          {TIME_CONTROLS.map((tc) => {
            const isSelected = timeControl === tc.id;
            return (
              <TouchableOpacity
                key={tc.id}
                style={[
                  styles.timeBtn,
                  isSelected && styles.timeBtnActive,
                  { width: 100 }
                ]}
                activeOpacity={0.8}
                onPress={() => setTimeControl(tc.id)}
              >
                <Text style={[styles.timeLabel, isSelected && styles.timeLabelActive]}>
                  {tc.label}
                </Text>
                <Text style={[styles.timeSub, isSelected && styles.timeSubActive]}>
                  {tc.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
`;

c = c.replace(/<View style=\{styles\.timeGrid\}>[\s\S]*?<\/View>/, replacement);
fs.writeFileSync('src/app/play/create.tsx', c);
