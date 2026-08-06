window.FUNNEL = {
  "product": "chair-taichi",
  "brand": "Tai Chi en silla",
  "screens": [
    {
      "id": "tried_before",
      "type": "single",
      "section": "Mi perfil",
      "figure": "/assets/2f_tried.webp",
      "q": "¿Ha probado alguna vez el tai chi en silla?",
      "options": [
        {
          "value": "yes",
          "label": "Sí"
        },
        {
          "value": "no",
          "label": "No"
        }
      ]
    },
    {
      "id": "intro_encourage",
      "type": "info",
      "image": "/assets/3.webp",
      "title": "¡Lo hará de maravilla!",
      "body": "El tai chi en silla es una opción de ejercicio físico suave y eficaz.\n\n**Se pondrá en forma en casa utilizando únicamente una silla**, ¡antes de lo que imagina!"
    },
    {
      "id": "focus_areas",
      "type": "multi",
      "section": "Mi perfil",
      "photos": true,
      "q": "Para empezar, indíquenos en qué áreas le gustaría centrarse:",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "lose_weight",
          "label": "Adelgazar",
          "img": "/assets/4a_wight.webp"
        },
        {
          "value": "feel_healthier",
          "label": "Siéntase más sano",
          "img": "/assets/4b_health.webp"
        },
        {
          "value": "lower_stress",
          "label": "Reducir el estrés",
          "img": "/assets/4c_stress.webp"
        },
        {
          "value": "memory_focus",
          "label": "Mejore la memoria y la concentración",
          "img": "/assets/4d_focus.webp"
        }
      ]
    },
    {
      "id": "intro_solution",
      "type": "info",
      "personalize": true,
      "image": "/assets/5.webp",
      "title": "¡Tenemos la solución perfecta!",
      "body": "Para {genderPlural} en su {decade}, el Tai Chi en silla es una opción excelente para **adelgazar con el mínimo esfuerzo**.\n\nDe 10 a 15 minutos al día para empezar a notar los primeros cambios."
    },
    {
      "id": "body_now",
      "type": "single",
      "section": "Mi perfil",
      "layout": "cards",
      "q": "¿Cómo describiría usted su cuerpo?",
      "options": [
        {
          "value": "thin",
          "label": "Delgado",
          "img": "/assets/6_thin.webp"
        },
        {
          "value": "mid",
          "label": "De tamaño medio",
          "img": "/assets/6_mid.webp"
        },
        {
          "value": "plump",
          "label": "Regordete",
          "img": "/assets/6_plump.webp"
        },
        {
          "value": "plus",
          "label": "Tallas grandes",
          "img": "/assets/6_plus.webp"
        }
      ]
    },
    {
      "id": "dream_body",
      "type": "single",
      "section": "Mi perfil",
      "layout": "cards",
      "q": "¿Cuál es su «cuerpo ideal»?",
      "options": [
        {
          "value": "slim",
          "label": "Delgado",
          "img": "/assets/7_slim.webp"
        },
        {
          "value": "toned",
          "label": "Tonificado",
          "img": "/assets/7_toned.webp"
        },
        {
          "value": "curvy",
          "label": "Con curvas",
          "img": "/assets/7_curvy.webp"
        },
        {
          "value": "sizes",
          "label": "Unas tallas más pequeñas",
          "img": "/assets/7_smaller.webp"
        }
      ]
    },
    {
      "id": "target_areas",
      "type": "multi",
      "section": "Mi perfil",
      "photos": true,
      "q": "¿En qué áreas desea centrarse?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "legs",
          "label": "Piernas",
          "img": "/assets/8_legs.webp"
        },
        {
          "value": "belly",
          "label": "Vientre",
          "img": "/assets/8_belly.webp"
        },
        {
          "value": "arms",
          "label": "Brazos",
          "img": "/assets/8_arms.webp"
        },
        {
          "value": "butt",
          "label": "Trasero",
          "img": "/assets/8_butt.webp"
        },
        {
          "value": "face_neck",
          "label": "Rostro y cuello",
          "img": "/assets/8_neck.webp"
        }
      ]
    },
    {
      "id": "height",
      "type": "slider",
      "section": "Mi perfil",
      "q": "¿Qué estatura tiene?",
      "sub": "Utilizaremos esta información para determinar su ritmo ideal de pérdida de peso",
      "units": [
        "cm",
        "ft"
      ],
      "field": "height"
    },
    {
      "id": "weight",
      "type": "slider",
      "section": "Mi perfil",
      "q": "¿Cuál es su peso actual?",
      "units": [
        "kg",
        "lb"
      ],
      "field": "weight",
      "computeBMI": true
    },
    {
      "id": "goal_weight",
      "type": "slider",
      "section": "Mi perfil",
      "q": "¡Entendido! ¿Y cuál es su peso objetivo?",
      "sub": "Basta con una cifra aproximada; podrá modificarla fácilmente más adelante.",
      "units": [
        "kg",
        "lb"
      ],
      "field": "goal_weight",
      "noteTitle": "¡Un objetivo realista!",
      "note": "Un objetivo moderado y gradual es más fácil de alcanzar y de mantener. Los cambios pequeños y constantes son los que perduran."
    },
    {
      "id": "intro_smallchange",
      "type": "info",
      "image": "/assets/bodies_2b.jpg",
      "title": "Perder tan solo un 5 % de su peso puede mejorar su salud",
      "body": "Incluso un cambio pequeño pero constante puede reducir el riesgo de padecer muchas enfermedades comunes, y el «Tai Chi en silla» le facilita dar el primer paso.\n\nFuente: Asociación Americana del Corazón (AHA)."
    },
    {
      "id": "projection_1",
      "type": "info",
      "projChart": true,
      "headerTop": true,
      "title": "Prevemos que alcanzará <span class='hl'>{goal}{wu}</span> en {projdate}",
      "blockTitle": "Solo tiene que perder {lose} {wu}",
      "blockBody": "Eso supone aproximadamente el {pct} % de su peso corporal. Según la Asociación Americana del Corazón, alcanzar este objetivo puede reducir el riesgo de padecer diabetes, hipertensión y otras afecciones de salud."
    },
    {
      "id": "intro_plan",
      "type": "info",
      "personalize": true,
      "image": "/assets/14b.webp",
      "title": "Una meta sin un plan no es más que un deseo",
      "body": "Las personas {genderPlural} en su {decade} pueden necesitar un enfoque **adaptado a sus necesidades específicas**.\n\n¡Cuéntenos un poco más sobre usted para que podamos elaborar un plan de entrenamiento de taichí en silla que se adapte a sus necesidades!"
    },
    {
      "id": "last_in_shape",
      "type": "single",
      "section": "Actividad",
      "q": "¿Cuándo fue la última vez que se encontró en la mejor forma física de su vida?",
      "options": [
        {
          "value": "lt1",
          "label": "Hace menos de un año",
          "emoji": "🤔"
        },
        {
          "value": "1to2",
          "label": "Hace entre 1 y 2 años",
          "emoji": "😮"
        },
        {
          "value": "gt3",
          "label": "Hace más de tres años",
          "emoji": "😥"
        },
        {
          "value": "never",
          "label": "Nunca",
          "emoji": "🙅"
        }
      ]
    },
    {
      "id": "typical_day",
      "type": "single",
      "section": "Actividad",
      "q": "¿Cómo es un día normal para usted?",
      "options": [
        {
          "value": "sitting",
          "label": "Me paso la mayor parte del día sentado",
          "emoji": "💻"
        },
        {
          "value": "some",
          "label": "De vez en cuando me cambio de lugar",
          "emoji": "🚶"
        },
        {
          "value": "active",
          "label": "Estoy de pie todo el día",
          "emoji": "👟"
        }
      ]
    },
    {
      "id": "activities",
      "type": "multi",
      "section": "Actividad",
      "q": "¿Alguna de estas actividades forma parte de su vida?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "pet",
          "label": "Pasear a mi mascota",
          "emoji": "🐕"
        },
        {
          "value": "child",
          "label": "Pasar mucho tiempo realizando actividades con mi hijo",
          "emoji": "👨‍👩‍👧"
        },
        {
          "value": "stairs",
          "label": "Subir escaleras con frecuencia",
          "emoji": "🪜"
        },
        {
          "value": "household",
          "label": "Tareas domésticas en curso",
          "emoji": "🏡"
        }
      ],
      "noneValue": "none",
      "noneLabel": "No",
      "noneEmoji": "🙅"
    },
    {
      "id": "walks_freq",
      "type": "single",
      "section": "Actividad",
      "q": "¿Con qué frecuencia sale a dar un paseo?",
      "options": [
        {
          "value": "daily",
          "label": "Casi todos los días"
        },
        {
          "value": "3to4",
          "label": "3 o 4 veces por semana"
        },
        {
          "value": "1to2",
          "label": "1 o 2 veces por semana"
        },
        {
          "value": "rare",
          "label": "Una vez al mes o menos"
        }
      ]
    },
    {
      "id": "intro_effective",
      "type": "info",
      "image": "/assets/18.webp",
      "title": "Tai Chi en silla: tan eficaz como suave",
      "body": "Los movimientos lentos y conscientes marcan una diferencia real. El tai chi en silla le ayuda a **sentirse más saludable, desarrollar una fuerza constante y mejorar su equilibrio y movilidad**, sin el esfuerzo que suponen los entrenamientos de alto impacto.\n\nFuente: «Walking for Exercise», Harvard Nutrition Source"
    },
    {
      "id": "relate_breath",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/20_stairs.jpg?v=2",
      "q": "¿Se identifica con la siguiente afirmación?",
      "statement": "Me quedo sin aliento después de subir un tramo de escaleras",
      "options": [
        {
          "value": "no",
          "label": "No",
          "emoji": "🚫"
        },
        {
          "value": "yes",
          "label": "Sí",
          "emoji": "✅"
        }
      ]
    },
    {
      "id": "relate_hard",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/20_excersize.webp",
      "q": "¿Se identifica con la siguiente afirmación?",
      "statement": "Suelo rendirme fácilmente cuando los ejercicios son demasiado difíciles o aburridos",
      "options": [
        {
          "value": "no",
          "label": "No",
          "emoji": "🚫"
        },
        {
          "value": "yes",
          "label": "Sí",
          "emoji": "✅"
        }
      ]
    },
    {
      "id": "relate_progress",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/21_workout.webp",
      "q": "¿Se identifica con la siguiente afirmación?",
      "statement": "No estoy seguro de cómo elegir los entrenamientos que más me convienen",
      "options": [
        {
          "value": "no",
          "label": "No",
          "emoji": "🚫"
        },
        {
          "value": "yes",
          "label": "Sí",
          "emoji": "✅"
        }
      ]
    },
    {
      "id": "intro_eligible",
      "type": "info",
      "eligChart": true,
      "headerTop": true,
      "title": "¡Una gran noticia: cumple los requisitos!",
      "lead": "Parece que el «Tai Chi en silla» es ideal para usted; es hora de alcanzar sus objetivos.",
      "blockTitle": "Según los datos históricos de Tai Motion sobre las mujeres en su {decade}",
      "blockBody": "¡Empiece a ver resultados en tan solo una semana y siga perdiendo peso de forma constante hasta alcanzar su objetivo **{goal} {wu}**!"
    },
    {
      "id": "pain_points",
      "type": "multi",
      "section": "Actividad",
      "layout": "cards",
      "q": "¿Le supone algún problema alguna de las siguientes situaciones?",
      "sub": "Su plan abordará estos aspectos para garantizar su comodidad y seguridad.",
      "options": [
        {
          "value": "back",
          "label": "Espalda sensible",
          "img": "/assets/23_back.webp"
        },
        {
          "value": "knees",
          "label": "Dolor en las rodillas",
          "img": "/assets/23_knees.webp"
        },
        {
          "value": "hips",
          "label": "Caderas tensas",
          "img": "/assets/23_hips.webp"
        }
      ],
      "noneValue": "none",
      "noneLabel": "Ninguna de las anteriores",
      "noneImg": "/assets/23_none.webp"
    },
    {
      "id": "intro_lowimpact",
      "type": "info",
      "image": "/assets/25b.jpg",
      "title": "El tai chi en silla alivia la tensión en las rodillas y la espalda",
      "body": "El tai chi en silla es un ejercicio de bajo impacto y de intensidad moderada. Reduce al mínimo la tensión en articulaciones como las caderas, las rodillas y los tobillos.\n\nEsto lo convierte en una opción más segura que los entrenamientos de alto impacto: una **excelente opción si es usted propenso a sufrir molestias o dolores articulares.**"
    },
    {
      "id": "where_exercise",
      "type": "multi",
      "section": "Actividad",
      "q": "¿Dónde prefiere hacer ejercicio?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "home",
          "label": "En casa",
          "emoji": "🏠"
        },
        {
          "value": "outside",
          "label": "En el exterior",
          "emoji": "🌳"
        },
        {
          "value": "gym",
          "label": "Gimnasio",
          "emoji": "🏋️"
        },
        {
          "value": "any",
          "label": "Sin preferencia",
          "emoji": "🤷"
        }
      ]
    },
    {
      "id": "intro_home",
      "type": "info",
      "image": "/assets/27b.jpg",
      "title": "Descubra las ventajas de hacer ejercicio en casa",
      "body": "El Tai Chi en silla convierte su hogar en un espacio tranquilo para practicar. Lo único que necesita es una silla resistente.\n\nFomenta **la fuerza, el equilibrio y la concentración**, para que pueda moverse con libertad, incluso en los días más tranquilos."
    },
    {
      "id": "steps_need",
      "type": "single",
      "section": "Actividad",
      "q": "¿Cuántos pasos cree que necesita dar al día?",
      "options": [
        {
          "value": "easy",
          "label": "Fácil: menos de 5 000 pasos",
          "emoji": "👌"
        },
        {
          "value": "medium",
          "label": "Nivel medio: entre 5 000 y 10 000 pasos",
          "emoji": "🔥"
        },
        {
          "value": "hard",
          "label": "Difícil: >10 000 pasos",
          "emoji": "🏅"
        },
        {
          "value": "unsure",
          "label": "No estoy seguro",
          "emoji": "🤷"
        }
      ]
    },
    {
      "id": "intro_lowdose",
      "type": "info",
      "image": "/assets/28.webp",
      "title": "Mito: «Hay que ser flexible para practicar tai chi»",
      "body": "Sorprendentemente, esta creencia generalizada disuade a muchas personas de siquiera probar los ejercicios de taichí.\n\n**El taichí en silla demuestra que esto no es cierto.** Está diseñado para todos los niveles de flexibilidad y le ayuda a desarrollar fuerza, equilibrio y concentración de forma gradual, desde la comodidad de su silla en casa."
    },
    {
      "id": "ld_mobility",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/29.webp",
      "q": "¿Le gusta o no le gusta?",
      "statement": "Estiramientos",
      "options": [
        {
          "value": "dislike",
          "label": "No me gusta",
          "emoji": "👎"
        },
        {
          "value": "neutral",
          "label": "Neutro",
          "emoji": "😐"
        },
        {
          "value": "like",
          "label": "Me gusta",
          "emoji": "👍"
        }
      ]
    },
    {
      "id": "ld_breathing",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/30.webp",
      "q": "¿Le gusta o no le gusta?",
      "statement": "Zancada con silla",
      "options": [
        {
          "value": "dislike",
          "label": "No me gusta",
          "emoji": "👎"
        },
        {
          "value": "neutral",
          "label": "Neutro",
          "emoji": "😐"
        },
        {
          "value": "like",
          "label": "Me gusta",
          "emoji": "👍"
        }
      ]
    },
    {
      "id": "ld_balance",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/31.webp",
      "q": "¿Le gusta o no le gusta?",
      "statement": "Parte superior del cuerpo",
      "options": [
        {
          "value": "dislike",
          "label": "No me gusta",
          "emoji": "👎"
        },
        {
          "value": "neutral",
          "label": "Neutro",
          "emoji": "😐"
        },
        {
          "value": "like",
          "label": "Me gusta",
          "emoji": "👍"
        }
      ]
    },
    {
      "id": "ld_strength",
      "type": "single",
      "section": "Actividad",
      "layout": "ld",
      "cardImg": "/assets/33a.webp",
      "q": "¿Le gusta o no le gusta?",
      "statement": "Fuerza del tronco",
      "options": [
        {
          "value": "dislike",
          "label": "No me gusta",
          "emoji": "👎"
        },
        {
          "value": "neutral",
          "label": "Neutro",
          "emoji": "😐"
        },
        {
          "value": "like",
          "label": "Me gusta",
          "emoji": "👍"
        }
      ]
    },
    {
      "id": "projection_2",
      "type": "info",
      "projChart": true,
      "headerTop": true,
      "title": "¡Conseguirá el cuerpo de sus sueños incluso antes de lo que espera!",
      "lead": "Creemos que usted será...",
      "predict": "<span class='hl'>{goal}{wu}</span> por {projdate}",
      "chartCap": "*Según los datos de Tai Motion miembros con un objetivo similar",
      "body": "A continuación, cuéntenos más sobre su estilo de vida para que podamos ayudarle a alcanzar su objetivo de forma aún más eficaz."
    },
    {
      "id": "tension",
      "type": "single",
      "section": "Estilo de vida",
      "layout": "ld",
      "q": "¿Se siente alguna vez tenso mentalmente o nervioso?",
      "options": [
        {
          "value": "lots",
          "label": "Últimamente lo noto mucho",
          "short": "A lot lately",
          "emoji": "😫"
        },
        {
          "value": "some",
          "label": "Tengo mis altibajos",
          "short": "Ups & downs",
          "emoji": "😐"
        },
        {
          "value": "steady",
          "label": "En general, me siento bastante estable",
          "short": "Mostly steady",
          "emoji": "😌"
        }
      ]
    },
    {
      "id": "intro_stress",
      "type": "info",
      "stressChart": true,
      "headerTop": true,
      "title": "Reduzca el estrés y disminuya la ansiedad en un 42 % simplemente practicando tai chi en silla",
      "body": "Tan solo 20 minutos de tai chi en silla pueden reducir los niveles de cortisol y aumentar la serotonina, lo que mejora **el estado de ánimo, la concentración y la resiliencia emocional.**\n\nFuente: British Journal of Sports Medicine"
    },
    {
      "id": "water",
      "type": "single",
      "section": "Estilo de vida",
      "q": "¿Cuál es su consumo diario de agua?",
      "sub": "Es importante beber suficiente líquido al hacer ejercicio",
      "options": [
        {
          "value": "coffee",
          "label": "Normalmente bebo café o té",
          "emoji": "☕"
        },
        {
          "value": "low",
          "label": "Aproximadamente 2 vasos",
          "emoji": "💧"
        },
        {
          "value": "mid",
          "label": "De 2 a 6 vasos",
          "emoji": "💦"
        },
        {
          "value": "high",
          "label": "Más de 6 vasos",
          "emoji": "🌊"
        }
      ]
    },
    {
      "id": "mood",
      "type": "single",
      "section": "Estilo de vida",
      "q": "¿Cómo se encuentra la mayoría de los días?",
      "options": [
        {
          "value": "low",
          "label": "Bajo: a menudo me siento decaído o irritable",
          "emoji": "🔴"
        },
        {
          "value": "mixed",
          "label": "Con altibajos: depende del día",
          "emoji": "🟡"
        },
        {
          "value": "steady",
          "label": "Estoy bien; normalmente me siento bien",
          "emoji": "🟢"
        }
      ]
    },
    {
      "id": "intro_focus",
      "type": "info",
      "focusChart": true,
      "headerTop": true,
      "title": "Siéntase más tranquilo y concentrado en tan solo dos semanas",
      "body": "El tai chi en silla estimula la circulación cerebral y mejora el equilibrio energético, lo que le ayuda a sentirse **más lúcido, más motivado y emocionalmente más estable.**\n\nFuente: Harvard Health Publishing"
    },
    {
      "id": "rested",
      "type": "single",
      "section": "Estilo de vida",
      "layout": "ld",
      "q": "¿Con qué frecuencia se despierta sintiéndose descansado?",
      "options": [
        {
          "value": "always",
          "label": "Siempre",
          "emoji": "😊"
        },
        {
          "value": "often",
          "label": "Con frecuencia",
          "short": "Often",
          "emoji": "😌"
        },
        {
          "value": "rare",
          "label": "De vez en cuando",
          "short": "Rarely",
          "emoji": "🤭"
        },
        {
          "value": "never",
          "label": "Nunca",
          "emoji": "😴"
        }
      ]
    },
    {
      "id": "sleep_improve",
      "type": "multi",
      "section": "Estilo de vida",
      "q": "¿Hay algo que desee mejorar en relación con su sueño?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "ok",
          "label": "No, duermo bien"
        },
        {
          "value": "fall",
          "label": "Dificultad para conciliar el sueño"
        },
        {
          "value": "tired",
          "label": "Despertarse cansado"
        },
        {
          "value": "night",
          "label": "Despertarse por la noche"
        },
        {
          "value": "flashes",
          "label": "Sofocos / Sudores nocturnos",
          "femaleOnly": true
        },
        {
          "value": "schedule",
          "label": "Falta de un horario de sueño"
        }
      ]
    },
    {
      "id": "intro_sleep",
      "type": "info",
      "image": "/assets/41.webp",
      "title": "El tai chi en silla puede favorecer un sueño mejor y más profundo",
      "body": "La práctica regular de **tai chi en silla le ayuda a conciliar el sueño más rápidamente** y a disfrutar de un sueño más profundo y reparador, de modo que se despierte con energía y listo para afrontar el día."
    },
    {
      "id": "diet",
      "type": "multi",
      "section": "Estilo de vida",
      "q": "¿Sigue actualmente algún patrón alimentario concreto?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "no",
          "label": "No",
          "emoji": "🚫"
        },
        {
          "value": "lowcarb",
          "label": "Bajo en carbohidratos",
          "emoji": "🥗"
        },
        {
          "value": "veg",
          "label": "Vegetariano",
          "emoji": "🥦"
        },
        {
          "value": "plant",
          "label": "Totalmente de origen vegetal",
          "emoji": "🌱"
        },
        {
          "value": "pesc",
          "label": "Pescatariano",
          "emoji": "🍤"
        },
        {
          "value": "lactose",
          "label": "Sin lactosa",
          "emoji": "🥛"
        },
        {
          "value": "gluten",
          "label": "Sin gluten",
          "emoji": "🥖"
        },
        {
          "value": "keto",
          "label": "Ceto",
          "emoji": "🥑"
        },
        {
          "value": "other",
          "label": "Otros",
          "emoji": "🍽️"
        }
      ]
    },
    {
      "id": "produce",
      "type": "single",
      "section": "Estilo de vida",
      "layout": "ld",
      "q": "¿Cómo es su consumo de frutas y verduras?",
      "sub": "En general, ¿cuántas piezas de fruta y verdura consume al día?",
      "options": [
        {
          "value": "low",
          "label": "Nada o muy poco",
          "short": "Barely any",
          "emoji": "🙅"
        },
        {
          "value": "fair",
          "label": "Bastante",
          "short": "A fair bit",
          "emoji": "🍎"
        },
        {
          "value": "lots",
          "label": "Quizá sea un conejo",
          "short": "Loads",
          "emoji": "🥕"
        }
      ]
    },
    {
      "id": "intro_nutrition",
      "type": "info",
      "image": "/assets/43b.jpg",
      "title": "Fomente su metabolismo para obtener resultados duraderos",
      "body": "Además, recibirá un plan nutricional personalizado que le ayudará a mantener su energía, su salud y su progreso a largo plazo — **sin dietas estrictas ni restricciones alimentarias.**"
    },
    {
      "id": "cravings",
      "type": "multi",
      "section": "Estilo de vida",
      "q": "¿Qué alimentos le apetecen con más frecuencia?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "sweet",
          "label": "Dulces",
          "emoji": "🧁"
        },
        {
          "value": "salty",
          "label": "Aperitivos salados",
          "emoji": "🥨"
        },
        {
          "value": "fast",
          "label": "Comida rápida",
          "emoji": "🍟"
        },
        {
          "value": "wine",
          "label": "Me gusta el vino",
          "emoji": "🍷"
        },
        {
          "value": "soda",
          "label": "Refresco",
          "emoji": "🥤"
        }
      ],
      "noneValue": "none",
      "noneLabel": "Ninguna de las anteriores",
      "noneEmoji": "🤷"
    },
    {
      "id": "habits",
      "type": "multi",
      "section": "Estilo de vida",
      "q": "¿Tiene alguno de los siguientes hábitos?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "emotional",
          "label": "Alimentación emocional o por aburrimiento",
          "emoji": "😫"
        },
        {
          "value": "full",
          "label": "Seguir comiendo cuando ya se está lleno",
          "emoji": "🍩"
        },
        {
          "value": "late",
          "label": "Los tentempiés nocturnos",
          "emoji": "🌙"
        },
        {
          "value": "screen",
          "label": "Combinar el tiempo frente a la pantalla con la hora de la comida",
          "emoji": "💻"
        },
        {
          "value": "skip",
          "label": "Saltarse las comidas con demasiada frecuencia",
          "emoji": "🍽️"
        }
      ],
      "noneValue": "none",
      "noneLabel": "Ninguna de las anteriores",
      "noneEmoji": "🤷"
    },
    {
      "id": "tracker",
      "type": "single",
      "section": "Estilo de vida",
      "q": "¿Lleva usted un reloj inteligente o una pulsera de actividad?",
      "sub": "Por ejemplo: Apple Watch, Fitbit, Samsung Galaxy, etc.",
      "options": [
        {
          "value": "yes",
          "label": "Sí",
          "emoji": "✔️"
        },
        {
          "value": "no",
          "label": "No",
          "emoji": "✖️"
        }
      ]
    },
    {
      "id": "intro_brain",
      "type": "info",
      "image": "/assets/49c.jpg",
      "title": "El tai chi en silla podría reducir el riesgo de padecer Alzheimer hasta en un 51 %",
      "body": "La práctica regular de tai chi en silla mantiene el cerebro sano, ya que mejora la circulación, agudiza la memoria y protege contra el deterioro cognitivo, aspectos todos ellos fundamentales para **las mujeres mayores de 40 años.**\n\nFuente: Harvard Health Publishing"
    },
    {
      "id": "medications",
      "type": "single",
      "section": "Estilo de vida",
      "sectionLabel": "Salud y seguridad",
      "q": "¿Está tomando algún medicamento?",
      "sub": "Tenga la seguridad de que esta información es para su seguridad.",
      "options": [
        {
          "value": "yes",
          "label": "Sí"
        },
        {
          "value": "no",
          "label": "No"
        }
      ]
    },
    {
      "id": "mobility",
      "type": "single",
      "section": "Estilo de vida",
      "sectionLabel": "Salud y seguridad",
      "q": "¿Tiene alguna limitación física o de movilidad que debamos tener en cuenta?",
      "sub": "Tenga la seguridad de que esta información es para su seguridad.",
      "options": [
        {
          "value": "yes",
          "label": "Sí"
        },
        {
          "value": "no",
          "label": "No"
        },
        {
          "value": "na",
          "label": "Prefiero no responder"
        }
      ]
    },
    {
      "id": "intro_safe",
      "type": "info",
      "image": "/assets/52b.jpg",
      "title": "Dar prioridad a su salud y seguridad",
      "body": "Adapte siempre los movimientos a su cuerpo.\n\nLe recomendamos que consulte con su médico o fisioterapeuta antes de iniciar una nueva actividad que pueda afectar a su bienestar físico o a su salud en general."
    },
    {
      "id": "menopause",
      "type": "single",
      "section": "Estilo de vida",
      "femaleOnly": true,
      "q": "¿Ha pasado ya por la menopausia?",
      "sub": "Los cambios hormonales pueden afectar a su metabolismo y a sus necesidades nutricionales.",
      "options": [
        {
          "value": "no",
          "label": "No"
        },
        {
          "value": "going",
          "label": "Superarlo"
        },
        {
          "value": "passed",
          "label": "Ya lo he superado"
        },
        {
          "value": "unsure",
          "label": "No estoy seguro"
        },
        {
          "value": "na",
          "label": "Prefiero no responder"
        }
      ]
    },
    {
      "id": "intro_menopause_weight",
      "type": "info",
      "image": "/assets/57b.png",
      "femaleOnly": true,
      "title": "La pérdida de peso en todas las etapas de la vida",
      "body": "La menopausia puede dificultar la pérdida de peso, ya que los cambios hormonales afectan al almacenamiento de grasa y a la sensibilidad a la insulina. El tai chi en silla y una nutrición personalizada pueden ayudar a afrontar estos cambios.\n\nEsto hace que sea más fácil alcanzar los **objetivos de pérdida de peso** y **de bienestar**."
    },
    {
      "id": "loader",
      "type": "loader",
      "title": "Un momento, por favor...",
      "sub": "Preparando todo para usted",
      "per": 1600,
      "cards": [
        {
          "img": "/assets/55_1d.jpg",
          "text": "¡Creado por mujeres y para mujeres!"
        },
        {
          "img": "/assets/55_2d.jpg",
          "text": "Nos centramos en comprender su cuerpo, no en las dietas"
        },
        {
          "img": "/assets/55_3d.jpg",
          "text": "Nuestro enfoque para la pérdida de peso se basa en el cambio de los patrones de comportamiento"
        },
        {
          "img": "/assets/55_4d.jpg",
          "text": "Conseguirá controlar los hábitos alimentarios emocionales (de una vez por todas)"
        },
        {
          "img": "/assets/55_5d.jpg",
          "text": "Solo tiene que seguir su plan de acción personalizado para alcanzar su objetivo"
        },
        {
          "img": "/assets/55_6d.jpg",
          "text": "Solo se tarda 5 minutos al día"
        },
        {
          "img": "/assets/55_7d.jpg",
          "text": "Si comete un error, ¡tampoco pasa nada!"
        },
        {
          "img": "/assets/55_8d.jpg",
          "text": "Nadie es perfecto, y a todos nos pasa alguna vez que nos descarrilamos"
        },
        {
          "img": "/assets/55_9d.jpg",
          "text": "Le ayudaremos a retomar el rumbo"
        }
      ]
    },
    {
      "id": "intro_goodhands",
      "type": "info",
      "image": "/assets/56b.jpg",
      "title": "Está en buenas manos. Únase a las 1,8 millones de mujeres satisfechas que ya están obteniendo resultados",
      "body": "Deje que nos ocupemos de usted mientras usted se cuida. Estamos a su disposición en todo momento."
    },
    {
      "id": "intro_almost",
      "type": "info",
      "image": "/assets/57c.jpg",
      "title": "¡Ya casi está!",
      "body": "Está a solo unos instantes de descubrir un camino personalizado para verse y sentirse mejor que nunca.\n\n¡Terminemos explorando qué es lo que le motiva!"
    },
    {
      "id": "main_reason",
      "type": "multi",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "q": "¿Cuál es la razón principal por la que desea ponerse en forma?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "confident",
          "label": "Sentirme más segura de mi cuerpo"
        },
        {
          "value": "energetic",
          "label": "Siéntase más sano y con más energía"
        },
        {
          "value": "look",
          "label": "Cambiar mi aspecto"
        },
        {
          "value": "clothes",
          "label": "Que la ropa me quede mejor"
        },
        {
          "value": "other",
          "label": "Otros"
        }
      ]
    },
    {
      "id": "motivates",
      "type": "multi",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "q": "¿Qué le motiva a hacer ejercicio?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "health",
          "label": "Mejorar la salud"
        },
        {
          "value": "immune",
          "label": "Fortalecimiento del sistema inmunitario"
        },
        {
          "value": "look",
          "label": "Tiene mejor aspecto"
        },
        {
          "value": "strength",
          "label": "Desarrollar la fuerza y la resistencia"
        },
        {
          "value": "mood",
          "label": "Gestión del estrés / mejora del estado de ánimo"
        },
        {
          "value": "example",
          "label": "Dar un ejemplo positivo a los demás"
        },
        {
          "value": "other",
          "label": "Otros"
        }
      ]
    },
    {
      "id": "motivation_level",
      "type": "single",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "q": "En este momento, ¿qué grado de motivación tiene para alcanzar su peso ideal?",
      "options": [
        {
          "value": "ready",
          "label": "Estoy preparado al 100 %"
        },
        {
          "value": "hopeful",
          "label": "Tengo muchas esperanzas puestas en ello"
        },
        {
          "value": "unsure",
          "label": "No estoy muy seguro"
        },
        {
          "value": "easy",
          "label": "Me lo estoy tomando con calma, por así decirlo"
        }
      ]
    },
    {
      "id": "obstacles",
      "type": "multi",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "q": "¿Qué le resultaba difícil para mantener la motivación a la hora de hacer ejercicio en el pasado?",
      "sub": "Seleccione todas las opciones que correspondan",
      "options": [
        {
          "value": "results",
          "label": "No observé resultados apreciables"
        },
        {
          "value": "regain",
          "label": "Adelgazaría, pero volvería a engordar"
        },
        {
          "value": "noplan",
          "label": "No contaba con un plan claro y eficaz"
        },
        {
          "value": "toohard",
          "label": "Los planes anteriores resultaban demasiado difíciles"
        },
        {
          "value": "notime",
          "label": "No tuve tiempo para hacer ejercicio"
        },
        {
          "value": "coaching",
          "label": "Entrenamiento ineficaz"
        },
        {
          "value": "none",
          "label": "No me encontré con ningún obstáculo"
        },
        {
          "value": "other",
          "label": "Otros"
        }
      ]
    },
    {
      "id": "intro_sustainable",
      "type": "info",
      "image": "/assets/62.webp",
      "title": "¿Por qué la gente abandona sus intentos de adelgazar?",
      "body": "Precisamente por eso nuestro programa se centra en pequeños cambios sostenibles en su estilo de vida, para que pueda **transformar cómo se siente y disfrutar de una salud plena durante toda la vida.**"
    },
    {
      "id": "explore",
      "type": "multi",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "q": "Mientras personalizamos su viaje, ¿qué más le gustaría explorar?",
      "sub": "Nuestro enfoque integral va más allá de la pérdida de peso para mejorar su bienestar, su estado de ánimo y su salud.",
      "options": [
        {
          "value": "energy",
          "label": "Aumentar mis niveles de energía"
        },
        {
          "value": "habits",
          "label": "Fomentar hábitos saludables"
        },
        {
          "value": "digestion",
          "label": "Comprender la digestión"
        },
        {
          "value": "stress",
          "label": "Reducir el estrés"
        },
        {
          "value": "flex",
          "label": "Mejorar la flexibilidad"
        },
        {
          "value": "posture",
          "label": "Mejorar la postura"
        },
        {
          "value": "endurance",
          "label": "Mejorar la resistencia"
        },
        {
          "value": "immune",
          "label": "Fortalecer mi sistema inmunitario"
        }
      ]
    },
    {
      "id": "pace",
      "type": "single",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "layout": "ld",
      "q": "¡Su plan de tai chi en silla ya está listo! ¿En cuánto tiempo desea ponerse en forma?",
      "options": [
        {
          "value": "fast",
          "label": "Lo antes posible",
          "short": "Quickly",
          "emoji": "⚡"
        },
        {
          "value": "between",
          "label": "En algún punto entre ambos",
          "short": "In between",
          "emoji": "⚖️"
        },
        {
          "value": "slow",
          "label": "Con calma y constancia se consigue",
          "short": "Slow & steady",
          "emoji": "🌱"
        }
      ]
    },
    {
      "id": "intro_paced",
      "type": "info",
      "image": "/assets/65.webp",
      "title": "Perfecto: ¡hemos adaptado su plan a su ritmo!",
      "body": "Y esto no acaba aquí: seguiremos adaptando su plan personalizado a medida que su cuerpo y su nivel de actividad vayan cambiando a lo largo de su proceso."
    },
    {
      "id": "intro_focus20",
      "type": "info",
      "image": "/assets/66b.jpg",
      "title": "Tan solo 20 minutos de tai chi en silla mejoran la concentración y la capacidad intelectual",
      "body": "Aumenta el flujo sanguíneo hacia el cerebro y ayuda a **agudizar la memoria, mejorar la concentración y favorecer un pensamiento más lúcido.**"
    },
    {
      "id": "daypart",
      "type": "single",
      "section": "Estilo de vida",
      "sectionLabel": "Ya casi estamos",
      "q": "¿Cuándo se siente más «en plena forma»: por la mañana o por la noche?",
      "options": [
        {
          "value": "morning",
          "label": "Buenos días"
        },
        {
          "value": "night",
          "label": "Noche"
        },
        {
          "value": "depends",
          "label": "Depende"
        }
      ]
    },
    {
      "id": "loader_plan",
      "type": "loader",
      "title": "Creación de su plan de acción personalizado…",
      "steps": [
        "Analyzing Body Parameters",
        "Activity Preferences",
        "Health & Safety",
        "Generating Your Action Plan"
      ]
    },
    {
      "id": "email",
      "type": "email",
      "title": "Introduzca su correo electrónico para obtener su <span class='hl'>Plan de Tai Chi en silla!</span>"
    },
    {
      "id": "name",
      "type": "name",
      "title": "¿Cómo se llama usted?"
    },
    {
      "id": "goals",
      "type": "goals"
    }
  ],
  "abTestName": "quiz_length_2026_07",
  "variants": {
    "b": {
      "secs": [
        "My profile",
        "Activity"
      ],
      "cut": [
        "tension",
        "intro_stress",
        "water",
        "mood",
        "intro_focus",
        "rested",
        "sleep_improve",
        "intro_sleep",
        "diet",
        "produce",
        "intro_nutrition",
        "cravings",
        "habits",
        "tracker",
        "intro_brain",
        "medications",
        "mobility",
        "intro_safe",
        "menopause",
        "intro_menopause_weight",
        "loader",
        "intro_goodhands",
        "intro_almost",
        "main_reason",
        "motivates",
        "motivation_level",
        "obstacles",
        "intro_sustainable",
        "explore",
        "pace",
        "intro_paced",
        "intro_focus20",
        "daypart"
      ],
      "copy": {
        "projection_2": {
          "body": "Ahora vamos a crear su plan personalizado."
        }
      }
    },
    "c": {
      "secs": [
        "My profile",
        "Activity"
      ],
      "cut": [
        "tension",
        "intro_stress",
        "water",
        "mood",
        "intro_focus",
        "rested",
        "sleep_improve",
        "intro_sleep",
        "diet",
        "produce",
        "intro_nutrition",
        "cravings",
        "habits",
        "tracker",
        "intro_brain",
        "medications",
        "mobility",
        "intro_safe",
        "menopause",
        "intro_menopause_weight",
        "loader",
        "intro_goodhands",
        "intro_almost",
        "main_reason",
        "motivates",
        "motivation_level",
        "obstacles",
        "intro_sustainable",
        "explore",
        "pace",
        "intro_paced",
        "intro_focus20",
        "daypart",
        "height",
        "weight",
        "goal_weight",
        "projection_1",
        "projection_2"
      ],
      "copy": {
        "intro_eligible": {
          "blockBody": "¡Empiece a ver resultados en tan solo una semana y siga avanzando de forma constante hacia su objetivo!"
        }
      }
    }
  }
};
