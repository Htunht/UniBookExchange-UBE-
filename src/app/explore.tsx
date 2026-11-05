import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">လေ့လာရန်</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            အက်ပ်ကို အသုံးပြုရာတွင် အထောက်အကူဖြစ်စေမည့်{'\n'}အချက်အလက်များကို ဒီမှာ ကြည့်နိုင်ပါသည်။
          </ThemedText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">Expo လမ်းညွှန်</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="စာမျက်နှာများသို့ သွားလာခြင်း">
            <ThemedText type="small">
              ဒီအက်ပ်တွင် စာမျက်နှာနှစ်ခု ရှိပါသည်။ <ThemedText type="code">src/app/index.tsx</ThemedText> နှင့်{' '}
              <ThemedText type="code">src/app/explore.tsx</ThemedText>
            </ThemedText>
            <ThemedText type="small">
              <ThemedText type="code">src/app/_layout.tsx</ThemedText> ဖိုင်က အောက်ခြေရှိ စာမျက်နှာရွေးချယ်ခလုတ်များကို ပြင်ဆင်ပေးပါသည်။
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <ThemedText type="linkPrimary">ပိုမိုလေ့လာရန်</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android၊ iOS နှင့် ဝဘ်တွင် အသုံးပြုနိုင်ခြင်း">
            <ThemedView type="backgroundElement" style={styles.collapsibleContent}>
              <ThemedText type="small">
                ဒီအက်ပ်ကို Android၊ iOS နှင့် ဝဘ်တွင် အသုံးပြုနိုင်ပါသည်။ ဝဘ်ဗားရှင်းဖွင့်ရန် အက်ပ်ကို စတင်ထားသော terminal တွင်{' '}
                <ThemedText type="smallBold">w</ThemedText> ကို နှိပ်ပါ။
              </ThemedText>
              <Image
                source={require('@/assets/images/tutorial-web.png')}
                style={styles.imageTutorial}
              />
            </ThemedView>
          </Collapsible>

          <Collapsible title="ပုံများ">
            <ThemedText type="small">
              မျက်နှာပြင်အရွယ်အစားအမျိုးမျိုးအတွက် ပုံဖိုင်အမည်နောက်တွင် <ThemedText type="code">@2x</ThemedText> နှင့်{' '}
              <ThemedText type="code">@3x</ThemedText> ကို ထည့်သုံးနိုင်ပါသည်။
            </ThemedText>
            <Image source={require('@/assets/images/react-logo.png')} style={styles.imageReact} />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <ThemedText type="linkPrimary">ပိုမိုလေ့လာရန်</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="အလင်းနှင့် အမှောင်ပုံစံ">
            <ThemedText type="small">
              အက်ပ်တွင် အလင်းနှင့် အမှောင်ပုံစံ နှစ်မျိုးလုံး အသုံးပြုနိုင်ပါသည်။{' '}
              <ThemedText type="code">useColorScheme()</ThemedText> ဖြင့် လက်ရှိပုံစံကို သိရှိပြီး အရောင်များကို ပြောင်းလဲနိုင်ပါသည်။
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <ThemedText type="linkPrimary">ပိုမိုလေ့လာရန်</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="လှုပ်ရှားမှုပုံစံများ">
            <ThemedText type="small">
              ဒီစာမျက်နှာရှိ အချက်အလက်များကို ဖွင့်ပိတ်ရာတွင် လှုပ်ရှားမှုပုံစံ ထည့်ထားပါသည်။{' '}
              <ThemedText type="code">src/components/ui/collapsible.tsx</ThemedText> က{' '}
              <ThemedText type="code">react-native-reanimated</ThemedText> ကို အသုံးပြုထားပါသည်။
            </ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
