# وثيقة نظام اكتشاف الاحتيال - جزء التعلم الآلي (ML Pipeline)

---

## 1. البيانات (Dataset)

### المصدر
**Credit Card Fraud Detection Dataset** من Kaggle.
- الرابط: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
- معاملات بطاقات ائتمان أوروبية في سبتمبر 2013
- إجمالي المعاملات: **284,807 معاملة**
- عدد المعاملات الاحتيالية: **492** (%0.172 فقط)

### هيكل البيانات (عمود عمود)

| العمود | النوع | الشرح |
|--------|-------|-------|
| `Time` | float | الوقت بالثواني من أول معاملة في المجموعة (مداه من 0 إلى 172,792 ثانية ≈ 48 ساعة) |
| `V1` إلى `V28` | float | **مكونات PCA** — تم تحويل البيانات الأصلية باستخدام Principal Component Analysis للحفاظ على الخصوصية (لأن البيانات المالية حساسة). كل عمود V هو مكون رئيسي (Principal Component) |
| `Amount` | float | قيمة المعاملة باليورو (مداه: 0 إلى 25,691) |
| `Class` | int (0/1) | المتغير المستهدف — 0 = سليمة (legitimate)، 1 = احتيال (fraud) |

### لماذا PCA؟
البيانات الأصلية تحتوي على تفاصيل حساسة (مثل موقع المتجر، نوع العملية، إلخ). تم تطبيق PCA لتحويل هذه التفاصيل إلى 28 مكونًا رئيسيًا (V1-V28) بحيث:
- لا يمكن استرجاع البيانات الأصلية منها
- تظل الأنماط الإحصائية المفيدة للتمييز بين fraud و legitimate محفوظة
- الأبعاد 29 و 30 هما `Time` و `Amount` — لم يتم تطبيق PCA عليهما

---

## 2. الاستكشاف الأولي للبيانات (EDA)

### الهدف
فهم طبيعة البيانات قبل بناء النماذج. تم تنفيذ EDA في ملفين:

### أ. EDA التفصيلي — `ml/notebooks/eda_fraud_detection.py`
ينتج 6 رسوم بيانية:

#### 1. توزيع الفئات (Class Distribution)
```
Legitimate: 284,315 (%99.828)
Fraud:              492 (%0.172)
```
- عدم توازن شديد جدًا (imbalanced dataset)
- هذا يبرر استخدام **SMOTE** لاحقًا لموازنة الفئات

#### 2. تحليل المبلغ والوقت (Amount & Time)
المعاملات الاحتيالية تميل لمبالغ أقل — معظمها تحت $100. بينما المعاملات السليمة تنتشر على نطاق أوسع. التوزيع الزمني يظهر أن:
- المعاملات السليمة تتبع نمطًا يوميًا (قلة في الساعات المتأخرة)
- المعاملات الاحتيالية أكثر انتشارًا ولا تتبع نفس النمط

#### 3. أفضل خصائص PCA تمييزًا (Top 8 Discriminating Features)
أكثر 8 خصائص V تفرق بين الفئتين (حسب الفرق بين متوسطاتها):
```
V10, V12, V14, V17, V11, V16, V9, V7
```
هذه الخصائص لها توزيعات مختلفة جدًا بين fraud و legitimate.

#### 4. مصفوفة الارتباط (Correlation Heatmap)
- V10 أعلى ارتباط سلبي مع Class ≈ −0.23
- V14 أعلى ارتباط إيجابي مع Class ≈ +0.20
- V3, V4, V11, V12 أيضًا عندها ارتباط ملحوظ
- **Time و Amount:** ارتباطهما مع Class ضعيف جدًا (< 0.01)

#### 5. SMOTE Before vs After
```
قبل SMOTE:  227,451 legitimate vs 394 fraud  (نسبة 0.17%)
بعد SMOTE:  227,451 legitimate vs 227,451 fraud  (نسبة 50%)
```
SMOTE يولد نقاطًا اصطناعية للفئة الأقل باستخدام أقرب الجيران (k=5).

#### 6. المعاملات عبر الزمن (Time Series)
معدل الاحتيال ليس ثابتًا عبر الـ 48 ساعة:
- في بعض الساعات يرتفع إلى ~0.6%
- المؤشرات: متوسط معدل الاحتيال ≈ 0.17%

**الملخص JSON:** يتم تصدير `eda_summary.json` يحتوي على إحصائيات وصفية.

### ب. EDA المضمن في Training Pipeline — `train.py` (دالة `eda_summary`)
تطبع ملخصًا سريعًا قبل التدريب:
```python
{
  "total_rows": 284807,
  "fraud_count": 492,
  "legitimate_count": 284315,
  "fraud_rate": 0.001727,
  "missing_values": 0,
  "duplicate_rows": 0,
  "amount_stats": { "min": 0, "max": 25691, "mean": 88.2, "std": 250.1 }
}
```

**نتائج EDA الرئيسية:**
| الخاصية | القيمة | التأثير |
|---------|--------|---------|
| Missing values | 0 | لا حاجة لـ imputation |
| Duplicate rows | 0 | لا حاجة لإزالة مكررات |
| Fraud rate | 0.172% | يجب معالجة class imbalance |
| توزيع Amount | منحرف لليمين | يفضل استخدام RobustScaler |
| ارتباط Time مع Class | ضعيف | Time قد لا يكون مفيدًا جدًا لكن نموذج RF قد يستخرج أنماطًا منه |
| ارتباطات V مع Class | متوسطة (0.1-0.23) | معظم قوة التمييز تأتي من V1-V28 |

---

## 3. المعالجة المسبقة (Preprocessing)

### خطوات المعالجة بالترتيب:

#### أ. فصل المتغيرات عن الهدف
```python
X = df.drop("Class", axis=1).values   # الأعمدة: Time, V1..V28, Amount
y = df["Class"].values
```
- الترتيب: `[Time, V1, V2, ..., V28, Amount]` ← 30 ميزة
- **مهم جدًا:** هذا الترتيب يجب أن يتطابق تمامًا مع inference.

#### ب. تقسيم البيانات (Train/Test Split)
```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
```
- تدريب: 80% (227,846 معاملة) — منها 394 fraud
- اختبار: 20% (56,961 معاملة) — منها 98 fraud
- `stratify=y`: يحافظ على نفس نسبة الفئات (0.172%) في القسمين — ضروري جدًا لعدم توازن الفئات

#### ج. التحجيم (Scaling) — لماذا RobustScaler؟

| الـ Scaler | مميزاته | عيوبه | لماذا اخترنا RobustScaler |
|-----------|---------|-------|--------------------------|
| **StandardScaler** | يطرح المتوسط ويقسم على الانحراف المعياري | حساس جدًا للـ outliers (القيم المتطرفة) | ❌ مع `Amount` فيه outliers قوية |
| **MinMaxScaler** | يضغط القيم بين 0 و 1 | يتأثر جدًا بالقيم المتطرفة | ❌ |
| **RobustScaler** | يستخدم الوسيط (median) والمدى الربيعي (IQR) | أقل حساسية للـ outliers | ✅ الأفضل هنا |
| **MaxAbsScaler** | يحافظ على الإشارة | لا يتعامل مع outliers | ❌ |

`RobustScaler` يطرح **الوسيط** ويقسم على **المدى الربيعي (IQR)**:
```
X_scaled = (X - median) / (Q3 - Q1)
```
- Q1 = الربع الأول (percentile 25)
- Q3 = الربع الثالث (percentile 75)

هذا يجعله مقاومًا للقيم المتطرفة — مثالي لـ `Amount` الذي فيه قيم تصل إلى 25,691 بينما المتوسط 88 فقط.

**التطبيق:**
```python
scaler = RobustScaler()
X_train = scaler.fit_transform(X_train)  # يتعلم median و IQR
X_test  = scaler.transform(X_test)       # يستخدم نفس القيم (no data leakage)
```

**ملاحظة مهمة:** الـ scaler يُدرب على كل الـ 30 ميزة معًا وليس كل ميزة لوحدها — لأنه يأخذ المصفوفة كاملة.

#### د. موازنة الفئات — لماذا SMOTE؟
بعد التقسيم، عندنا imbalance شديد:
```
Training set: 227,451 legitimate vs 394 fraud (Fraud rate: 0.17%)
```

بدائل SMOTE وسبب اختياره:

| التقنية | شرح | مشكلتها | لماذا اخترنا SMOTE |
|---------|-----|---------|-------------------|
| **SMOTE** | يولد نقاطًا اصطناعية باستخدام interpolation بين أقرب الجيران | قد يولد noise | ✅ الأكثر استخدامًا والأفضل للـ tabular data |
| **Random Oversampling** | يكرر عينات الفئة الأقل عشوائيًا | يؤدي إلى overfitting (نفس النقاط المكررة) | ❌ |
| **Random Undersampling** | يحذف عينات من الفئة الأكبر | يفقد معلومات قيمة | ❌ (عندنا 227K legit — حذفها خسارة) |
| **ADASYN** | مشابه لـ SMOTE لكن يركز على النقاط الصعبة | قد يعطي وزن زائد للـ noise | ❌ |
| **Tomek Links / ENN** | يحذف النقاط المتداخلة | لا يزيد عدد الفئة الأقل | ❌ (لازم نزود عدد fraud) |

SMOTE يعمل كالتالي:
1. يختار نقطة من الفئة الأقل (fraud)
2. يجد أقرب k جيران لها (k=5)
3. يختار جارًا عشوائيًا
4. يولد نقطة جديدة على الخط بين النقطتين
5. يكرر حتى توازن الفئات

النتيجة بعد SMOTE:
```
X_res: 454,902 (227,451 × 2) — نفس العدد لكل فئة
```

---

## 4. النماذج المُدرّبة (Trained Models)

### أ. Logistic Regression (LR)

**لماذا LR؟**
- سريع جدًا (training و inference)
- قابل للتفسير (المعاملات تظهر أهمية كل ميزة)
- Baseline جيد

**Hyperparameter Tuning:**
```python
param_grid = {"C": [0.1, 1.0, 10.0]}
```
- `C`: معامل التسوية العكسية — قيم أقل = تنظيم أقوى
- تم استخدام `GridSearchCV` مع `StratifiedKFold` (2 folds) لتقييم كل قيمة
- `class_weight="balanced"`: يعطي وزنًا أكبر تلقائيًا للفئة الأقل

**الاختيار:** `C=10.0` — أقل تنظيم، يسمح للنموذج بالتقاط أنماط أكثر تعقيدًا.

**الأداء:**
| المقياس | القيمة |
|---------|--------|
| Precision | 0.1375 |
| Recall | 0.898 |
| F1 | 0.238 |
| AUC-ROC | **0.9715** |
| Best Threshold | 0.79 |

AUC-ROC مرتفع لكن Precision منخفض جدًا — يعني عنده كثير False Positives.

### ب. Random Forest (RF) ← **الموديل المعتمد**

**لماذا RF؟**
- يلتقط علاقات غير خطية بين الميزات
- أقل عرضة للـ overfitting من decision trees الفردية (ensemble)
- يعطي feature importance تلقائيًا
- يتعامل مع الـ imbalance أفضل من LR

**Hyperparameters:**
```python
n_estimators=200    # عدد الأشجار — أكثر = أفضل لكن أبطأ
max_depth=15        # العمق الأقصى — يمنع overfitting
min_samples_split=5 # أقل عدد عينات لتقسيم عقدة — يمنع overfitting
class_weight="balanced"  # يعطي وزن للفئة الأقل
```

**لماذا 200 شجرة وليس 100؟**
بديل 100 شجرة يعطي AUC أقل (~0.97). 200 شجرة هو توازن بين الدقة والسرعة. 500 شجرة قد يحسن قليلًا لكنه أبطأ جدًا.

**لماذا max_depth=15؟**
بدون تحديد العمق، الشجرة قد تصل لعمق 100+ وتتعلم noise (overfitting). 15 هو العمق المناسب بناءً على GridSearch.

**لماذا class_weight="balanced"؟**
لأن imbalance قوي، الوزن للأقل يضمن أن النموذج لا يتجاهل fraud كلية.

**الأداء:**
| المقياس | القيمة |
|---------|--------|
| Precision | **0.846** |
| Recall | **0.786** |
| F1 | **0.815** |
| AUC-ROC | **0.9855** |
| Best Threshold | 0.78 |
| Confusion Matrix | TN: 56,850 / FP: 14 / FN: 21 / TP: 77 |

هذا الأداء على test set (56,961 معاملة):
- 77 من 98 fraud تم اكتشافهم (21 فاتوا)
- 14 من 56,863 سليمة تم تصنيفهم خطأ كـ fraud

### ج. XGBoost (XGB)

**لماذا XGB؟**
- أحد أقوى خوارزميات الـ gradient boosting
- يتعامل مع imbalance ب `scale_pos_weight`
- غالبًا يتفوق على RF

**سبب عدم اختياره:** الدقة أقل قليلًا من RF (F1: 0.738 vs 0.815) — وهذا على الأرجح لأن XGB يحتاج tuning أعمق (learning_rate, subsample, etc.)

**الأداء:**
| المقياس | القيمة |
|---------|--------|
| F1 | 0.738 |
| AUC-ROC | 0.980 |
| Recall | 0.878 |
| Precision | 0.637 |

### د. Isolation Forest (IF) — غير مراقب (Unsupervised)

**لماذا IF؟**
- يعمل بدون الحاجة للـ Class labels
- يكتشف الشذوذ (anomalies) مباشرة
- يستخدم كـ unsupervised baseline

**طريقة العمل:**
- لا يستخدم SMOTE (لأنه unsupervised)
- `contamination = 492 / 284807 = 0.001727` — نسبة الاحتيال الفعلية
- يبني أشجار عشوائية ويعزل النقاط الشاذة (كلما كانت النقطة أسهل في العزل، كانت شاذة أكثر)

**الأداء:** ضعيف نسبيًا لأن البيانات في الأصل PCA — قليل من الـ outliers البارزين.

## 5. مقارنة النماذج واختيار Random Forest

### جدول المقارنة

| الموديل | Precision | Recall | F1 | AUC-ROC | التعليق |
|---------|-----------|--------|-----|---------|---------|
| **Random Forest** | **0.846** | 0.786 | **0.815** | **0.985** | ✅ المختار |
| XGBoost | 0.637 | **0.878** | 0.738 | 0.980 | recall أعلى لكن precision أقل |
| Logistic Regression | 0.138 | 0.898 | 0.238 | 0.972 | baseline سريع |
| Isolation Forest | 0.308 | 0.337 | 0.322 | 0.668 | ضعيف (unsupervised) |

### لماذا Random Forest؟

1. **أفضل F1 Score (0.815)** — توازن ممتاز بين Precision و Recall
2. **أفضل AUC-ROC (0.985)** — قدرة تمييز عالية جدًا
3. **FP منخفض جدًا (14 فقط)** — مهم للنظام لأن FP = إزعاج للمحللين
4. **FN مقبول (21)** — 21 فاتوا من 98 في test set (أغلبهم احتمال ضعيف اكتشفهم LR و XGB)
5. **قوي ضد الـ imbalance** — `class_weight="balanced"` و ensemble trees
6. **Feature importance** — يمكنه إظهار أي الميزات الأكثر تأثيرًا
7. **سرعة Inference جيدة** — O(log n) لكل شجرة × 200 شجرة — مقبول جدًا للـ batch

### قرار Threshold

تم اختيار **threshold = 0.78** (بدلاً من 0.5 الافتراضي):
- عند 0.78، F1-score هو الأفضل (تم إيجاده بـ `find_best_threshold`)
- عند 0.5: Recall أعلى لكن Precision أقل بكثير (يزيد FP)
- عند 0.78: Precision 0.846 مع Recall 0.786

لو كنا نفضل Recall أعلى (نكتشف Fraud أكثر) على حساب FP، نستخدم threshold أقل.
لو كنا نفضل Precision أعلى (نتأكد من Fraud) على حساب فقدان بعض Fraud، نستخدم threshold أعلى.

---

## 6. خط الأنابيب للاستدلال (Inference Pipeline)

### تسلسل الاستدلال:

```
مستخدم → رفع CSV → API (FastAPI) → Celery Worker → ModelRegistry → DB + Response
```

### أ. الاستدلال الفردي (Single Prediction)
```
POST /api/v1/predict/single
```
1. يأخذ `TransactionCreate` schema
2. يحولها إلى feature vector: `[Time, V1, V2, ..., V28, Amount]` (30 قيمة)
3. يرسل إلى `model_registry.predict(features)`
4. الـ model registry: يحول إلى numpy → يطبق RobustScaler → `predict_proba` → يقارن بـ threshold
5. يرجع label (0/1) + probability
6. يسجل Transaction + Prediction + FraudAlert في DB

### ب. الاستدلال الجماعي (Batch Prediction)
```
POST /api/v1/predict/batch  →  يرجِع job_id
GET  /api/v1/predict/batch/{job_id}  →  poll status
```
1. رفع CSV مع `Time, Amount, V1..V28` (واختياريًا `Class` للمقارنة)
2. الـ API يتحقق من صحة الملف ووجوده
3. يرسل محتوى CSV إلى Celery task
4. الـ worker:
   - يقرأ CSV بـ pandas
   - يتحقق من الأعمدة المطلوبة
   - يبني feature vectors لكل صف
   - ينفذ batch inference بـ `model_registry.predict_batch()`
   - يسجل كل المعاملات + التوقعات + التنبيهات
   - يرجع summary: `{total, fraud_count, legitimate_count}`
5. الـ frontend يpoll كل 2 ثانية للحصول على التحديث

### ج. الفرق بين Training و Inference (مهم جدًا!)

| الخطوة | Training | Inference |
|--------|----------|-----------|
| Feature order | `[Time, V1..V28, Amount]` | `[Time, V1..V28, Amount]` ✅ متطابق الآن |
| Scaler | `fit_transform` على كل الـ 30 عمود | `transform` بنفس الـ scaler المُدرّب |
| Threshold | 0.78 (تم إيجاده بـ `find_best_threshold`) | 0.78 (from settings/rf_metadata) |

### د. تحجيم الأداء (Performance)
- **Batch size في inference:** كل الـ CSV مرة واحدة (numpy vectorized)
- `predict_proba` يعمل على كل المصفوفة دفعة واحدة
- التعقيد الزمني: O(n × t × d) حيث n = عدد الصفوف، t = 200 tree، d = 30 feature
- 100,000 معاملة ≈ 1-5 ثواني (حسب حجم الـ dataset)

---

## 7. هيكل الملفات

```
ml/
├── data/
│   └── creditcard.csv              # Dataset الأصلي (284,807 معاملة)
├── models/
│   ├── random_forest.pkl           # ✅ الموديل المعتمد (22 MB)
│   ├── scaler.pkl                  # RobustScaler المُدرّب
│   ├── logistic_regression.pkl     # Logistic Regression
│   ├── xgboost.pkl                 # XGBoost
│   ├── isolation_forest.pkl        # Isolation Forest
│   ├── rf_metadata.json           # مقاييس Random Forest
│   ├── lr_metadata.json           # مقاييس Logistic Regression
│   ├── xgb_metadata.json          # مقاييس XGBoost
│   └── training_summary.json      # ملخص كل النماذج
├── notebooks/
│   ├── eda_fraud_detection.py      # EDA مع 6 رسوم بيانية
│   └── model_evaluation.py         # تقييم الموديل مع 6 رسوم
├── reports/                        # مخرجات الرسوم البيانية (EDA + Evaluation)
└── ML_PIPELINE_DOC.md              # هذه الوثيقة

backend/app/ml/
├── pipeline/
│   └── train.py                    # training pipeline الكامل
├── model_registry.py               # ModelRegistry (singleton للـ inference)
└── artifacts/                      # مسار احتياطي للموديلات
```

---

## 8. ملخص القرارات التقنية

| القرار | الاختيار | لماذا؟ |
|--------|---------|--------|
| Scaler | RobustScaler | البيانات فيها outliers قوية في Amount (max 25,691 vs mean 88) |
| Class Balancing | SMOTE (k=5) | أفضل من oversampling/undersampling للـ tabular data، يولد نقاطًا واقعية |
| Train/Test Split | 80/20 مع stratify | ضروري للحفاظ على توزيع الفئات النادر جدًا (0.17%) |
| الموديل الأساسي | Random Forest (200 trees, depth=15) | أفضل F1 و AUC، FP قليل جدًا |
| Threshold | 0.78 | تم إيجاده بـ optimization على F1 (بدلاً من 0.5 الافتراضي) |
| Loss Function | Log Loss (cross-entropy) | `predict_proba` يعطي probabilities حقيقية |
| التسوية (Regularization) | max_depth=15 + min_samples_split=5 | يمنع overfitting |
| متغيرات الموديل | 30 متغير (Time + V1-V28 + Amount) | PCA الأصلي يضمن الخصوصية ويمنع multi-collinearity |
| مسار الـ model | `/ml/models/random_forest.pkl` | Volume مشترك بين backend و celery worker |
| الجودة (Accuracy) | Precision 84.6%, Recall 78.6%, AUC 0.985 | الأداء ممتاز على test set مع FP = 14 فقط من 56,961 |يتم التعرف على الاحتيال
