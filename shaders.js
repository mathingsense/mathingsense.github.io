export const vs = `#version 300 es
    precision highp float;

    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec3 aColor;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;

    out vec3 vColor;

    void main() {
        gl_Position =
            uProjection *
            uView *
            uModel *
            vec4(aPosition, 1.0);

        vColor = aColor;
    }
`;

export const fs = `#version 300 es
    precision highp float;

    in vec3 vColor;
    out vec4 outColor;

    void main() {
        outColor = vec4(vColor, 1.0);
    }
`;


export const litVs = `#version 300 es
    precision highp float;

    layout(location = 0) in vec3 aPosition;
    layout(location = 1) in vec3 aColor;
    layout(location = 2) in vec3 aNormal;

    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;

    out vec3 vColor;
    out vec3 vNormal;

    void main() {
        vec4 worldPosition = uModel * vec4(aPosition, 1.0);

        gl_Position = uProjection * uView * worldPosition;

        vColor = aColor;
        vNormal = mat3(uModel) * aNormal;
    }
`;

export const litFs = `#version 300 es
    precision highp float;

    in vec3 vColor;
    in vec3 vNormal;

    out vec4 outColor;

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDirection = normalize(vec3(-0.5, 1.0, 0.7));

        float diffuse = max(dot(normal, lightDirection), 0.0);
        float lighting = 0.35 + 0.65 * diffuse;

        outColor = vec4(vColor * lighting, 1.0);
    }
`;