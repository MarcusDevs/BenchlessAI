import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';

const ink = '#0b1422';
const muted = '#93a2b8';
const green = '#c5fa2d';

const pages = [
  {
    eyebrow: 'RECOVERY IS NOT THE SIDELINE',
    title: 'Don’t get\nbenched.',
    body: 'Tap where it hurts and see what training may still be possible while you recover.',
    cta: 'Start check-in',
  },
  {
    eyebrow: 'FIRST, YOUR SPORT',
    title: 'What do you\nplay?',
    body: 'We’ll tailor your recovery check-in to the way you train.',
    cta: 'Continue',
  },
  {
    eyebrow: 'YOUR CHECK-IN',
    title: 'Where does it\nhurt today?',
    body: 'Choose the area that needs attention. You can update this during your check-in.',
    cta: 'See my options',
  },
];

const sports = ['Soccer', 'Basketball', 'Running', 'Something else'];
const areas = ['Knee', 'Ankle or foot', 'Hip or groin', 'Back or upper body'];

function Brand() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandMark}>
        <View style={styles.logoBar} /><View style={styles.logoPost} /><View style={styles.logoBase} />
        <View style={styles.logoWeightLeft} /><View style={styles.logoWeightRight} />
      </View>
      <Text style={styles.brandName}>BENCHLESS <Text style={styles.brandAI}>AI</Text></Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState('');
  const [complete, setComplete] = useState(false);
  const page = pages[step];
  const choices = step === 1 ? sports : areas;

  function next() {
    if (complete) {
      setComplete(false);
      setStep(0);
      setSelected('');
      return;
    }
    if (step < pages.length - 1) {
      setStep(step + 1);
      setSelected('');
    } else {
      setComplete(true);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Brand />
          {!complete && <Pressable onPress={() => setStep(2)} accessibilityRole="button"><Text style={styles.skip}>Skip</Text></Pressable>}
        </View>

        {!complete && <View style={styles.progressRow}>
          {pages.map((_, index) => <View key={index} style={[styles.progressTrack, index <= step && styles.progressActive]} />)}
          <Text style={styles.stepText}>0{step + 1} / 03</Text>
        </View>}

        <View style={styles.heroArt}>
          <View style={styles.orbit} />
          <View style={styles.orbitInner} />
          <View style={styles.artCore}><Text style={styles.artGlyph}>{complete ? '✓' : step === 0 ? '↗' : step === 1 ? '⚽' : '✚'}</Text></View>
          <View style={styles.sparkOne} /><View style={styles.sparkTwo} />
          <View style={styles.artCaption}><View style={styles.liveDot} /><Text style={styles.artCaptionText}>{complete ? 'CHECK-IN READY' : 'TRAIN SMART. RECOVER STRONG.'}</Text></View>
        </View>

        {complete ? <>
          <Text style={styles.eyebrow}>YOUR NEXT MOVE</Text>
          <Text style={styles.title}>Keep moving\nwith a plan.</Text>
          <Text style={styles.body}>Your check-in is ready. Benchless helps you find training options that respect how you feel.</Text>
        </> : <>
          <Text style={styles.eyebrow}>{page.eyebrow}</Text>
          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.body}>{page.body}</Text>
        </>}

        {!complete && step > 0 && (
          <View style={styles.choices}>
            {choices.map((choice, index) => (
              <Pressable key={choice} onPress={() => setSelected(choice)} style={[styles.choice, selected === choice && styles.choiceSelected]}>
                <View style={[styles.choiceNumber, selected === choice && styles.choiceNumberSelected]}><Text style={styles.choiceNumberText}>0{index + 1}</Text></View>
                <Text style={styles.choiceText}>{choice}</Text>
                <Text style={styles.choiceArrow}>{selected === choice ? '✓' : '↗'}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={styles.button} onPress={next} accessibilityRole="button">
          <Text style={styles.buttonText}>{complete ? 'Start over' : page.cta}</Text>
          <Text style={styles.buttonArrow}>{complete ? '↻' : '→'}</Text>
        </Pressable>
        <Text style={styles.footnote}>{complete ? 'Listen to your body. Progress at your pace.' : step === 0 ? 'Built around your check-in.' : 'You can update this any time.'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: ink },
  scroll: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 12, paddingBottom: 30 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: green, alignItems: 'center', justifyContent: 'center', shadowColor: green, shadowOpacity: 0.25, shadowRadius: 12, elevation: 5 },
  logoBar: { position: 'absolute', width: 19, height: 3, borderRadius: 2, backgroundColor: ink, top: 11 },
  logoPost: { position: 'absolute', width: 3, height: 10, borderRadius: 2, backgroundColor: ink, top: 13, left: 12 },
  logoBase: { position: 'absolute', width: 17, height: 3, borderRadius: 2, backgroundColor: ink, bottom: 10 },
  logoWeightLeft: { position: 'absolute', width: 3, height: 8, borderRadius: 2, backgroundColor: ink, top: 9, left: 8 },
  logoWeightRight: { position: 'absolute', width: 3, height: 8, borderRadius: 2, backgroundColor: ink, top: 9, right: 8 },
  brandName: { color: '#f4f5fa', fontWeight: '900', fontSize: 17, letterSpacing: -0.5 },
  brandAI: { color: green, fontWeight: '900' },
  skip: { color: muted, fontSize: 14, fontWeight: '600', padding: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28 },
  progressTrack: { height: 3, flex: 1, borderRadius: 3, backgroundColor: '#263346' },
  progressActive: { backgroundColor: green },
  stepText: { color: '#94a3ba', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginLeft: 7 },
  heroArt: { height: 230, marginTop: 13, marginBottom: 14, backgroundColor: '#111e30', borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#1b2a40' },
  orbit: { position: 'absolute', width: 190, height: 190, borderWidth: 1, borderColor: '#283951', borderRadius: 95 },
  orbitInner: { position: 'absolute', width: 138, height: 138, borderWidth: 1, borderColor: '#26374d', borderRadius: 69 },
  artCore: { width: 84, height: 84, borderRadius: 26, backgroundColor: green, transform: [{ rotate: '-8deg' }], alignItems: 'center', justifyContent: 'center', shadowColor: green, shadowOpacity: 0.2, shadowRadius: 22 },
  artGlyph: { fontSize: 47, lineHeight: 58, color: ink, fontWeight: '900' },
  sparkOne: { position: 'absolute', width: 14, height: 14, borderRadius: 5, backgroundColor: green, top: 52, right: '27%', transform: [{ rotate: '20deg' }] },
  sparkTwo: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: '#8395ae', bottom: 63, left: '28%' },
  artCaption: { position: 'absolute', bottom: 17, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#19273a', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: green },
  artCaptionText: { color: '#b5c1d2', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  eyebrow: { color: green, fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginTop: 9, marginBottom: 11 },
  title: { color: '#f4f5fa', fontSize: 42, lineHeight: 45, fontWeight: '900', letterSpacing: -2.1 },
  body: { color: muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 340 },
  choices: { gap: 8, marginTop: 19 },
  choice: { minHeight: 54, borderRadius: 16, borderWidth: 1, borderColor: '#27364b', backgroundColor: '#111e30', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 11 },
  choiceSelected: { borderColor: green, backgroundColor: '#19283b' },
  choiceNumber: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#26364b', alignItems: 'center', justifyContent: 'center' },
  choiceNumberSelected: { backgroundColor: green },
  choiceNumberText: { color: '#acb9cb', fontWeight: '800', fontSize: 10 },
  choiceText: { color: '#f1f3f8', fontWeight: '700', fontSize: 14, flex: 1 },
  choiceArrow: { color: green, fontSize: 16, fontWeight: '700' },
  button: { minHeight: 58, borderRadius: 18, backgroundColor: green, marginTop: 'auto', paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonText: { color: ink, fontSize: 16, fontWeight: '800' },
  buttonArrow: { color: ink, fontSize: 23, fontWeight: '600' },
  footnote: { color: '#7889a1', fontSize: 11, textAlign: 'center', marginTop: 12, fontWeight: '600' },
});
